from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class LayoutTest(unittest.TestCase):
    def test_package_includes_bridge_assets(self) -> None:
        package_json = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        packaged_files = set(package_json["files"])

        # The package may include the bridge either as a directory entry
        # or as an explicit list of files. Accept both layouts.
        has_bridge_dir = "crates/oris-claude-bridge/" in packaged_files
        has_bridge_files = {
            "crates/oris-claude-bridge/Cargo.toml",
            "crates/oris-claude-bridge/Cargo.lock",
            "crates/oris-claude-bridge/Cross.toml",
            "crates/oris-claude-bridge/src/",
        }.issubset(packaged_files)
        self.assertTrue(
            has_bridge_dir or has_bridge_files,
            "package.json files must include oris-claude-bridge assets",
        )
        self.assertIn("bin/", packaged_files)

    def test_hooks_config_is_active(self) -> None:
        payload = json.loads((ROOT / "hooks/hooks.json").read_text(encoding="utf-8"))
        if "hooks" in payload:
            self.assertIsInstance(payload["hooks"], dict)
            self.assertTrue(payload["hooks"])
            self.assertIn("PreToolUse", payload["hooks"])
            return

        self.assertTrue(payload["enabled"])
        self.assertEqual(payload["mode"], "active")

    def test_specialist_directory_exists(self) -> None:
        self.assertTrue((ROOT / "agents/specialists").exists())

    def test_rule_pack_directories_exist(self) -> None:
        for relative in ["rules/common", "rules/typescript", "rules/java", "rules/python", "rules/golang"]:
            with self.subTest(relative=relative):
                self.assertTrue((ROOT / relative).exists())


if __name__ == "__main__":
    unittest.main()
