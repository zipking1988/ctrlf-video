"""Public synthetic demo catalog, independent of private user videos and models."""

from ctrlf_video.schema import Answer, hms


def catalog() -> dict:
    def event(start: int, end: int, action: str, caption: str, frames: list[int]) -> dict:
        return {
            "video_id": "demo_parcel",
            "start": float(start),
            "end": float(end),
            "start_hms": hms(start),
            "end_hms": hms(end),
            "action": action,
            "summary": caption,
            "support_level": "high",
            "evidence": [
                {
                    "t": float(t),
                    "t_hms": hms(t),
                    "frame_id": f"demo_parcel_f{t}",
                    "uri": f"/media/demo_parcel/frames/{t}.jpg",
                    "caption": caption,
                    "asr": None,
                }
                for t in frames
            ],
        }

    left = event(
        0,
        5,
        "Package on the left of the workbench",
        "The package is on the left of the workbench, with tape beside it.",
        [0],
    )
    scene = event(
        0,
        18,
        "Workbench and stationary objects",
        (
            "The three synthetic stages show a workbench, an illuminated overhead "
            "light, tape on the left and tools."
        ),
        [0, 6, 13],
    )
    tape = event(
        0,
        18,
        "Tape on the left",
        "The tape is on the left in both the first and last stages.",
        [0, 13],
    )
    lighting = event(
        0,
        18,
        "Overhead light is on",
        "The overhead light is on in all three synthetic stages.",
        [0, 6, 13],
    )
    center = event(
        5,
        11,
        "Package at the center of the workbench",
        "The package is at the center of the workbench, with pale tape on top.",
        [6, 10],
    )
    right = event(
        11,
        18,
        "Package on the right of the workbench",
        (
            "The package changes from the center to the right; no identifiable "
            "person is shown moving it."
        ),
        [13],
    )
    definitions = [
        (
            "center",
            "When is the package at the center?",
            "ok",
            "The package is at the center from 00:05 to 00:11.",
            [center],
            [],
        ),
        (
            "right",
            "When does it appear on the right?",
            "ok",
            "The package appears on the right from 00:11.",
            [right],
            [],
        ),
        (
            "person",
            "Can we identify who moved it?",
            "partial",
            "The package appears on the right at 00:11, but who moved it cannot be confirmed.",
            [right],
            ["No person appears in the demo; who moved it and how remain unknown."],
        ),
        (
            "forklift",
            "Is there a forklift?",
            "no_result",
            "No forklift appears in this 18-second synthetic demo.",
            [],
            [],
        ),
        (
            "failure",
            "View failure example",
            "error",
            "This search did not complete. Previously reviewed results are preserved.",
            [],
            [],
        ),
    ]
    definitions.extend(
        [
            (
                "left",
                "Where is the package initially?",
                "ok",
                "The package is on the left from 00:00 to 00:05.",
                [left],
                [],
            ),
            (
                "timeline",
                "Show the package positions in time order.",
                "ok",
                (
                    "The three stages are left 00:00–00:05, center 00:05–00:11 and right "
                    "00:11–00:18. "
                    "These are transitions between synthetic stills."
                ),
                [left, center, right],
                [],
            ),
            (
                "dwell",
                "Which position is shown longest?",
                "ok",
                (
                    "The right stage is longest at 7 seconds; center lasts 6 seconds and "
                    "left lasts 5. These are synthetic segment durations."
                ),
                [right, center, left],
                [],
            ),
            (
                "compare",
                "Compare the first and last package positions.",
                "ok",
                (
                    "The package starts on the left and ends on the right. Both frames "
                    "are from the same synthetic video."
                ),
                [left, right],
                [],
            ),
            (
                "continuous",
                "Do these frames establish continuous movement?",
                "partial",
                (
                    "Three position stages are visible, but continuous movement is not "
                    "established. The demo switches between still images."
                ),
                [left, center, right],
                [
                    (
                        "No continuous movement is shown; the movement path or method cannot "
                        "be inferred."
                    )
                ],
            ),
            (
                "objects",
                "Which stationary objects are visible?",
                "ok",
                (
                    "A workbench, overhead light, tape on the left and tools are visible. "
                    "The package position changes between synthetic stages."
                ),
                [scene],
                [],
            ),
            (
                "tape",
                "Does the tape position change?",
                "ok",
                (
                    "The tape is on the left at the start and end. Compare the frames at "
                    "00:00 and 00:13."
                ),
                [tape],
                [],
            ),
            (
                "lighting",
                "Does the lighting change?",
                "ok",
                (
                    "The overhead light is on throughout the three synthetic stages; no "
                    "off state is shown."
                ),
                [lighting],
                [],
            ),
            (
                "offscreen",
                "Does the light prove someone is present?",
                "partial",
                (
                    "The light is on, but that alone does not establish whether anyone is "
                    "present or offscreen."
                ),
                [lighting],
                [
                    (
                        "Offscreen areas are not visible; a lit lamp is not direct evidence "
                        "of someone being present."
                    )
                ],
            ),
            (
                "facts",
                "What facts can we confirm?",
                "ok",
                (
                    "The package is shown on the left, at the center and on the right. "
                    "The synthetic footage does not identify who moved it."
                ),
                [left, center, right],
                [],
            ),
            (
                "recheck",
                "Review the center evidence again.",
                "ok",
                (
                    "Review the center stage at 00:05–00:11 using frames at 00:06 and 00:10. "
                    "This is a preset example; no new model request was made."
                ),
                [center],
                [],
            ),
            (
                "label",
                "Can the tracking number be read?",
                "partial",
                (
                    "A label is visible, but the number cannot be reliably read. The "
                    "synthetic label is not real shipping data."
                ),
                [center],
                ["There is no verifiable tracking number; no number will be invented."],
            ),
        ]
    )
    continuations = {
        "center": {"What happened next?": "right", "Who moved it?": "person"},
        "right": {"Who moved it?": "person", "Compare before and after": "compare"},
        "person": {"What can we confirm?": "facts"},
        "left": {"What happened next?": "center"},
        "timeline": {"Which stage is longest?": "dwell", "Where was it initially?": "left"},
        "dwell": {"Where was it initially?": "left", "Compare before and after": "compare"},
        "compare": {
            "What about the middle?": "center",
            "Was the movement continuous?": "continuous",
        },
        "continuous": {"Which positions are confirmed?": "facts"},
        "objects": {"What about the tape?": "tape", "What about the light?": "lighting"},
        "tape": {"Show the full timeline": "timeline"},
        "lighting": {"Does that prove someone is present?": "offscreen"},
        "offscreen": {"Who moved it?": "person"},
        "facts": {"Show the full timeline": "timeline", "Can the label be read?": "label"},
        "label": {"What can we confirm?": "facts"},
        "forklift": {"Show the available frames": "objects"},
        "failure": {"Review the center evidence again.": "recheck"},
        "recheck": {"What happened next?": "right"},
    }
    query_titles = {item[0]: item[1] for item in definitions}
    queries = []
    for identifier, question, status, answer, events, unresolved in definitions:
        data = {
            "schema_version": "0.1",
            "status": status,
            "timebase": "video_absolute_seconds",
            "answer": answer,
            "events": events,
            "unresolved": unresolved,
            "followups": [
                query_titles[target] for target in continuations.get(identifier, {}).values()
            ],
            "trace": {
                "visible": {
                    "channels": ["visual_vector"],
                    "segments_reviewed": 3 if status != "error" else 0,
                    "evidence_segments": len(events),
                },
                "debug": None,
            },
            "errors": [],
        }
        if status == "error":
            data["errors"] = [
                {
                    "code": "demo_failure",
                    "stage": "demo",
                    "message": (
                        "This preset failure illustrates the difference between an error and "
                        "no result."
                    ),
                    "cause": "synthetic_demo_failure",
                    "retryable": False,
                    "suggested_action": "Choose another example question to continue.",
                    "docs_url": "/docs/errors",
                    "request_id": "demo_failure",
                }
            ]
        queries.append(
            {
                "id": identifier,
                "question": question,
                "response": Answer.model_validate(data).model_dump(),
                "suggested_replies": list(continuations.get(identifier, {})),
                "followup_map": continuations.get(identifier, {}),
            }
        )
    return {
        "mode": "fixture",
        "synthetic": True,
        "video": {
            "id": "demo_parcel",
            "title": "Package positions · Synthetic demo",
            "duration": 18,
            "uri": "/demo/video",
        },
        "queries": queries,
        "scenarios": [
            {
                "id": "tracking",
                "title": "Track positions",
                "description": "Find key stages, then ask where the package goes and who moved it.",
                "focus": "Three connected questions",
                "layout": "spread",
                "steps": [
                    {"query_id": "center", "parent": None},
                    {"query_id": "right", "question": "What happened next?", "parent": 0},
                    {"query_id": "person", "question": "Who moved it?", "parent": 1},
                ],
            },
            {
                "id": "chronology",
                "title": "Full timeline",
                "description": (
                    "Review all three stages, then compare duration and starting position."
                ),
                "focus": "Evidence in time order",
                "layout": "spread",
                "steps": [
                    {"query_id": "timeline", "parent": None},
                    {"query_id": "dwell", "question": "Which stage is longest?", "parent": 0},
                    {"query_id": "left", "question": "Where was it initially?", "parent": 0},
                ],
            },
            {
                "id": "comparison",
                "title": "Before and after",
                "description": (
                    "Compare the start and end, then inspect the middle and evidence limits."
                ),
                "focus": "Compare two frames",
                "layout": "spread",
                "steps": [
                    {"query_id": "compare", "parent": None},
                    {"query_id": "center", "question": "What about the middle?", "parent": 0},
                    {
                        "query_id": "continuous",
                        "question": "Was the movement continuous?",
                        "parent": 0,
                    },
                ],
            },
            {
                "id": "branches",
                "title": "Branching questions",
                "description": "Investigate the tape and light from the same starting question.",
                "focus": "Follow up from an earlier card",
                "layout": "spread",
                "steps": [
                    {"query_id": "objects", "parent": None},
                    {"query_id": "tape", "question": "What about the tape?", "parent": 0},
                    {"query_id": "lighting", "question": "What about the light?", "parent": 0},
                ],
            },
            {
                "id": "verification",
                "title": "Verify uncertainty",
                "description": (
                    "Ask about unknowns, then distinguish confirmed facts from unreadable details."
                ),
                "focus": "Unknowns and supported facts",
                "layout": "spread",
                "steps": [
                    {"query_id": "person", "parent": None},
                    {"query_id": "facts", "question": "What can we confirm?", "parent": 0},
                    {"query_id": "label", "question": "Can the label be read?", "parent": 1},
                ],
            },
            {
                "id": "boundaries",
                "title": "No result and recovery",
                "description": (
                    "Distinguish no results, search failures and evidence you can revisit."
                ),
                "focus": "No result / Error / Recovery",
                "layout": "status",
                "steps": [
                    {"query_id": "forklift", "parent": None},
                    {"query_id": "failure", "parent": None},
                    {"query_id": "recheck", "parent": 1},
                ],
            },
        ],
    }
