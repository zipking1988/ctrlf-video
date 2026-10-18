from itertools import pairwise

import pytest

from ctrlf_video.windows import plan_windows


@pytest.mark.parametrize("duration", [0.1, 5, 120, 121, 235, 3599, 3600])
def test_complete_windows_keep_absolute_time_overlap_and_tail(duration):
    windows = plan_windows(duration)
    assert windows[0].start == 0
    assert windows[-1].end == duration
    assert [w.index for w in windows] == list(range(len(windows)))
    assert all(0 < w.end - w.start <= 120 for w in windows)
    assert all(a.end - b.start == 5 for a, b in pairwise(windows))


def test_one_hour_requires_32_and_scenes_can_require_more():
    assert len(plan_windows(3600)) == 32
    scenes = tuple(float(t) for t in range(100, 3600, 100))
    windows = plan_windows(3600, scenes)
    assert len(windows) > 32
    assert windows[0].end == 100
    assert windows[-1].end == 3600
    assert all(a.end - b.start == 5 for a, b in pairwise(windows))


def test_tiny_scene_cuts_cannot_stall_window_progress():
    windows = plan_windows(130, (1.0, 2.0, 3.0, 4.0, 5.0, 120.0, 121.0))
    assert len(windows) < 5
    assert windows[-1].end == 130


@pytest.mark.parametrize(
    "duration,scenes",
    [
        (70.203467, (14.014, 26.026, 61.061, 70.1701)),
        (120.0, (119.967,)),
    ],
)
def test_near_tail_scene_does_not_add_an_unnecessary_paid_window(duration, scenes):
    windows = plan_windows(duration, scenes)
    assert len(windows) == 1
    assert windows[0].start == 0 and windows[0].end == duration


def test_last_scene_aligned_window_includes_the_actual_end():
    windows = plan_windows(300.203467, (100.0, 200.0, 300.1701))
    assert len(windows) == 3
    assert windows[-1].start == 195.0 and windows[-1].end == 300.203467
    assert all(0 < w.end - w.start <= 120 for w in windows)
    assert all(a.end - b.start == 5 for a, b in pairwise(windows))


@pytest.mark.parametrize("duration", [0, -1, float("nan"), float("inf"), 3601, True, "120"])
def test_invalid_duration(duration):
    with pytest.raises(ValueError):
        plan_windows(duration)


@pytest.mark.parametrize("scenes", [(float("nan"),), (True,), (130,), (0,), (20, 10), (10, 10)])
def test_invalid_scene_boundaries(scenes):
    with pytest.raises(ValueError):
        plan_windows(130, scenes)


def test_linux_sandbox_command_uses_absolute_bwrap_for_execv(tmp_path, monkeypatch):
    from ctrlf_video import media

    monkeypatch.setattr(media.platform, "system", lambda: "Linux")
    monkeypatch.setattr(
        media.shutil, "which", lambda name: "/usr/bin/bwrap" if name == "bwrap" else None
    )
    command = media.sandbox_command(tmp_path, ["ffprobe", "x"])
    assert command[0] == "/usr/bin/bwrap"
    assert command[-2:] == ["ffprobe", "x"]
