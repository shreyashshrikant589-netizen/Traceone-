"""Deterministic parser helpers for short witness statements."""

from __future__ import annotations

import re
from typing import Any

PERSON_KEYWORDS = {
    "child": ["child", "kid", "boy", "girl", "person", "man", "woman", "young person"],
    "elderly": ["elderly", "old man", "old woman", "aged", "senior"],
    "male": ["man", "boy", "male", "gentleman"],
    "female": ["woman", "girl", "female", "lady"],
    "marathi": {
        "child": ["मुलगा", "मुलगी", "मूल", "बाळ"],
        "elderly": ["वृद्ध", "म्हातारा", "म्हातारी"],
        "male": ["पुरुष"],
        "female": ["महिला"],
        "person": ["व्यक्ती"],
    },
}

CLOTHING_PATTERNS = [
    "red shirt",
    "blue shirt",
    "black jacket",
    "white t-shirt",
    "red dress",
    "blue jeans",
    "black pants",
    "school uniform",
    "लाल शर्ट",
    "निळा शर्ट",
    "काळा शर्ट",
    "पांढरा शर्ट",
    "शाळेचा गणवेश",
]

DIRECTION_PATTERNS = [
    "towards",
    "toward",
    "going to",
    "went to",
    "heading to",
    "heading towards",
    "from",
    "left",
    "right",
    "north",
    "south",
    "east",
    "west",
    "कडे",
    "दिशेने",
    "च्या दिशेने",
    "डावीकडे",
    "उजवीकडे",
    "उत्तर",
    "दक्षिण",
    "पूर्व",
    "पश्चिम",
]

LOCATION_PATTERNS = [
    "bus stand",
    "bus stop",
    "railway station",
    "station",
    "school",
    "college",
    "temple",
    "market",
    "gate",
    "exit",
    "parking",
    "hospital",
    "road",
    "bridge",
    "playground",
    "main gate",
    "entrance",
    "बस स्टँड",
    "बस स्थानक",
    "रेल्वे स्टेशन",
    "शाळा",
    "कॉलेज",
    "मंदिर",
    "बाजार",
    "गेट",
    "बाहेरचा मार्ग",
    "पार्किंग",
    "रस्ता",
    "पूल",
]

TIME_PATTERNS = [
    "10 minutes ago",
    "20 minutes ago",
    "1 hour ago",
    "at 10:30 am",
    "at 5 pm",
    "around 6 pm",
    "morning",
    "afternoon",
    "evening",
    "रात्री",
    "सकाळी",
    "दुपारी",
    "संध्याकाळी",
    "10 मिनिटांपूर्वी",
    "20 मिनिटांपूर्वी",
    "1 तासापूर्वी",
]

OBJECT_PATTERNS = [
    "bag",
    "backpack",
    "bicycle",
    "bike",
    "scooter",
    "auto",
    "car",
    "bus",
    "बॅग",
    "सायकल",
    "बाइक",
    "स्कूटर",
    "रिक्षा",
    "कार",
    "बस",
]

COLORS = ["red", "blue", "black", "white", "green", "yellow", "orange", "purple", "brown", "maroon", "pink", "gray", "grey"]


def normalize_text(text: str) -> str:
    """Normalize whitespace and lowercase for deterministic keyword matching."""
    return re.sub(r"\s+", " ", text.strip().lower())


def find_match(text: str, patterns: list[str]) -> str | None:
    """Return the first matched phrase from a list of patterns."""
    normalized_text = normalize_text(text)
    for pattern in patterns:
        if pattern in normalized_text:
            return pattern
    return None


def find_all_matches(text: str, patterns: list[str]) -> list[str]:
    """Return all matched phrases from a list of patterns in order."""
    normalized_text = normalize_text(text)
    matches: list[str] = []
    for pattern in patterns:
        if pattern in normalized_text:
            matches.append(pattern)
    return matches


def extract_person_hint(text: str) -> str | None:
    """Return a conservative person hint when a known keyword is present."""
    normalized = normalize_text(text)
    for candidate in PERSON_KEYWORDS["child"] + PERSON_KEYWORDS["elderly"] + PERSON_KEYWORDS["male"] + PERSON_KEYWORDS["female"] + PERSON_KEYWORDS["marathi"]["child"] + PERSON_KEYWORDS["marathi"]["elderly"] + PERSON_KEYWORDS["marathi"]["male"] + PERSON_KEYWORDS["marathi"]["female"] + PERSON_KEYWORDS["marathi"]["person"]:
        if candidate in normalized:
            if candidate in ("child", "kid", "boy", "girl", "मुलगा", "मुलगी", "मूल", "बाळ"):
                return "child"
            if candidate in ("elderly", "old man", "old woman", "वृद्ध", "म्हातारा", "म्हातारी"):
                return "elderly"
            if candidate in ("man", "boy", "male", "पुरुष"):
                return "man"
            if candidate in ("woman", "girl", "female", "महिला"):
                return "woman"
            if candidate in ("person", "व्यक्ती"):
                return "person"
    return None


def extract_clothing_hint(text: str) -> list[str]:
    """Return simple clothing phrases that appear in the text."""
    return find_all_matches(text, CLOTHING_PATTERNS)


def extract_color_hint(text: str) -> list[str]:
    """Return color terms that appear in the text."""
    normalized = normalize_text(text)
    matches: list[str] = []
    for color in COLORS:
        if color in normalized:
            matches.append(color)
    return matches


def extract_direction_hint(text: str) -> str | None:
    """Return a direction phrase or a direction-plus-location phrase when both are present."""
    text_norm = normalize_text(text)
    matched_direction = None
    for direction in DIRECTION_PATTERNS:
        if direction in text_norm:
            matched_direction = direction
            break

    if matched_direction:
        for location in LOCATION_PATTERNS:
            if location in text_norm:
                return f"{matched_direction} {location}"
        return matched_direction
    return None


def extract_location_hint(text: str) -> str | None:
    """Return a conservatively matched location phrase."""
    text_norm = normalize_text(text)
    for pattern in LOCATION_PATTERNS:
        if pattern in text_norm and not any(token in text_norm for token in ["towards", "toward", "going to", "went to", "heading to", "heading towards", "कडे", "दिशेने", "च्या दिशेने"]):
            return pattern
    return None


def extract_time_hint(text: str) -> str | None:
    """Return a conservative time phrase matched in the input text."""
    return find_match(text, TIME_PATTERNS)


def extract_object_hint(text: str) -> str | None:
    """Return the first object or vehicle phrase matched by the conservative dictionary."""
    return find_match(text, OBJECT_PATTERNS)


def extract_destination_hint(text: str) -> str | None:
    """Return a destination phrase when a location appears after a directional phrase."""
    text_norm = normalize_text(text)
    direction_keywords = ["towards", "toward", "going to", "went to", "heading to", "heading towards", "कडे", "दिशेने", "च्या दिशेने"]
    for phrase in LOCATION_PATTERNS:
        if phrase in text_norm and any(token in text_norm for token in direction_keywords):
            return phrase
    return None


def build_extracted_entities(text: str) -> dict[str, Any]:
    """Return a deterministic dictionary of extracted witness-entity hints."""
    entities: dict[str, Any] = {}
    person = extract_person_hint(text)
    clothing = extract_clothing_hint(text)
    colors = extract_color_hint(text)
    direction = extract_direction_hint(text)
    location = extract_location_hint(text)
    destination = extract_destination_hint(text)
    time_ref = extract_time_hint(text)
    object_hint = extract_object_hint(text)

    if person:
        entities["person_type"] = person
    if clothing:
        entities["clothing"] = clothing
    if colors:
        entities["colors"] = colors
    if direction:
        entities["direction"] = direction
    if location:
        entities["location"] = location
    if destination:
        entities["destination"] = destination
    if time_ref:
        entities["time_reference"] = time_ref
    if object_hint:
        entities["object_hint"] = object_hint
    return entities
