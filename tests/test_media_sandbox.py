"""Actual Linux decoder checks, including the Debian alternatives regression."""

import platform
import shutil
from pathlib import Path

import pytest

import ctrlf_video
from ctrlf_video.media import MediaError, frames, probe, run


@pytest.mark.parametrize("start,end", [(0, 6), (6, 12), (12, 18)])
@pytest.mark.parametrize("source_offset", [0, 7])
def test_window_sampling_keeps_absolute_timestamps_after_seeking(
    tmp_path, start, end, source_offset
):
    source = tmp_path / "source"
    source.mkdir()
    shutil.copyfile(
        Path(ctrlf_video.__file__).parent / "static" / "demo" / "parcel.mp4", source / "original"
    )
    if source_offset:
        shifted = source / "shifted.mp4"
        run(
            source,
            [
                shutil.which("ffmpeg"),
                "-nostdin",
                "-hide_banner",
                "-i",
                str(source / "original"),
                "-map",
                "0:v:0",
                "-c",
                "copy",
                "-output_ts_offset",
                str(source_offset),
                str(shifted),
            ],
        )
        shifted.replace(source / "original")
    metadata = probe(source)
    assert metadata["start_pts"] == pytest.approx(source_offset)
    decoded = frames(source, "seek_test", metadata, {"start": start, "end": end}, count=3)
    assert len(decoded) == 3
    times = [frame["t"] for frame in decoded]
    assert times == sorted(times)
    assert all(start <= timestamp < end for timestamp in times)
    assert all((source / "frames" / frame["file"]).is_file() for frame in decoded)


@pytest.mark.skipif(platform.system() != "Linux", reason="Linux namespace integration")
def test_linux_decoder_loads_runtime_libraries_but_cannot_read_other_sources_or_connect(tmp_path):
    for binary in ("bwrap", "ffprobe", "ffmpeg"):
        assert shutil.which(binary), f"Linux media acceptance requires {binary}"
    source = tmp_path / "source"
    source.mkdir()
    shutil.copyfile(
        Path(ctrlf_video.__file__).parent / "static" / "demo" / "parcel.mp4", source / "original"
    )
    metadata = probe(source)
    decoded = frames(source, "sandbox_test", metadata, metadata["windows"][0], count=3)
    assert metadata["duration"] == pytest.approx(18)
    assert len(decoded) == 3
    assert [frame["t"] for frame in decoded] == sorted(frame["t"] for frame in decoded)
    assert all((source / "frames" / frame["file"]).is_file() for frame in decoded)
    outside = tmp_path / "other-source"
    outside.write_text("synthetic source-isolation sentinel")
    with pytest.raises(MediaError):
        run(source, ["/bin/cat", str(outside)])
    with pytest.raises(MediaError):
        run(source, ["/bin/cat", "/etc/passwd"])
    output, _ = run(
        source,
        [
            "/usr/bin/python3",
            "-c",
            "import socket; s=socket.socket(); s.settimeout(2); "
            "code=s.connect_ex(('1.1.1.1',443)); print(code); assert code != 0",
        ],
    )
    assert int(output.strip()) != 0
