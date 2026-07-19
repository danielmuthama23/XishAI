"""
services/vision.py
──────────────────
AI vision pipeline:
  Step 1 — YOLOv11   : object detection
  Step 2 — CLIP      : semantic scene embedding / zero-shot classification
  Step 3 — SAM       : segment anything for region isolation
"""
from __future__ import annotations

import io
import os
from pathlib import Path
from typing import List, Tuple

# ---------------------------------------------------------------------------
# Model paths — download once and cache
# ---------------------------------------------------------------------------
YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "models/yolov11n.pt")
SAM_CHECKPOINT   = os.getenv("SAM_CHECKPOINT",  "models/sam_vit_h_4b8939.pth")
SAM_MODEL_TYPE   = os.getenv("SAM_MODEL_TYPE",  "vit_h")
DEVICE = "cpu"

# Emergency scene labels used for CLIP zero-shot classification
EMERGENCY_LABELS = [
    "fire and smoke",
    "flood and water damage",
    "car accident",
    "collapsed building",
    "medical emergency",
    "crowd and unrest",
    "power outage",
    "normal street scene",
]


# ---------------------------------------------------------------------------
# Lazy-loaded singletons (models are large; load once per worker process)
# ---------------------------------------------------------------------------
_yolo_model   = None
_clip_model   = None
_clip_preprocess = None
_sam_generator = None


def _get_yolo():
    global _yolo_model
    if _yolo_model is None:
        from ultralytics import YOLO
        _yolo_model = YOLO(YOLO_MODEL_PATH)
    return _yolo_model


def _get_clip():
    global _clip_model, _clip_preprocess
    if _clip_model is None:
        import clip
        import torch
        global DEVICE
        DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
        _clip_model, _clip_preprocess = clip.load("ViT-B/32", device=DEVICE)
    return _clip_model, _clip_preprocess


def _get_sam():
    global _sam_generator
    if _sam_generator is None:
        from segment_anything import SamAutomaticMaskGenerator, sam_model_registry
        sam = sam_model_registry[SAM_MODEL_TYPE](checkpoint=SAM_CHECKPOINT)
        sam.to(device=DEVICE)
        _sam_generator = SamAutomaticMaskGenerator(sam)
    return _sam_generator


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_vision_pipeline(image_bytes: bytes) -> dict:
    """
    Accept raw image bytes (from Azure Blob or upload).
    Returns a dict with:
        detected_objects  : list[str]
        clip_scene        : str   (best-matching EMERGENCY_LABEL)
        clip_confidence   : float
        sam_segment_count : int
        sam_largest_area  : float  (fraction of image)
    """
    import numpy as np
    from PIL import Image
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_np = np.array(image)

    detected  = _run_yolo(image_np)
    clip_scene, clip_conf = _run_clip(image)
    seg_count, largest_area = _run_sam(image_np)

    return {
        "detected_objects":  detected,
        "clip_scene":        clip_scene,
        "clip_confidence":   round(clip_conf, 3),
        "sam_segment_count": seg_count,
        "sam_largest_area":  round(largest_area, 3),
    }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _run_yolo(image_np) -> List[str]:
    """Run YOLOv11 and return a deduplicated list of detected class names."""
    model   = _get_yolo()
    results = model(image_np, verbose=False)
    names   = model.names
    classes = set()
    for r in results:
        for cls_id in r.boxes.cls.cpu().numpy().astype(int):
            classes.add(names[cls_id])
    return sorted(classes)


def _run_clip(image) -> Tuple[str, float]:
    """
    Zero-shot classify the scene against EMERGENCY_LABELS.
    Returns (best_label, confidence_probability).
    """
    import clip
    import torch
    model, preprocess = _get_clip()

    image_tensor = preprocess(image).unsqueeze(0).to(DEVICE)
    text_tokens  = clip.tokenize(EMERGENCY_LABELS).to(DEVICE)

    with torch.no_grad():
        image_features = model.encode_image(image_tensor)
        text_features  = model.encode_text(text_tokens)
        logits_per_image, _ = model(image_tensor, text_tokens)
        probs = logits_per_image.softmax(dim=-1).cpu().numpy()[0]

    best_idx = int(probs.argmax())
    return EMERGENCY_LABELS[best_idx], float(probs[best_idx])


def _run_sam(image_np) -> Tuple[int, float]:
    """
    Run SAM automatic mask generation.
    Returns (number_of_masks, area_of_largest_mask_as_fraction_of_image).
    """
    generator = _get_sam()
    masks     = generator.generate(image_np)

    if not masks:
        return 0, 0.0

    total_pixels = image_np.shape[0] * image_np.shape[1]
    areas = [m["area"] for m in masks]
    largest = max(areas) / total_pixels if total_pixels else 0.0
    return len(masks), largest
