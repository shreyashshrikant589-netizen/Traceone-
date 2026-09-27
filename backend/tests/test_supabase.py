import unittest
from unittest.mock import Mock, patch

from backend.config import Settings
from backend.services.supabase import (
    SupabaseConfigurationError,
    create_supabase_client,
)


class SupabaseClientTests(unittest.TestCase):
    def test_settings_load_empty_defaults_without_environment(self) -> None:
        settings = Settings(_env_file=None)

        self.assertEqual(settings.supabase_url, "")
        self.assertEqual(settings.supabase_anon_key, "")
        self.assertEqual(settings.supabase_service_role_key, "")
        self.assertEqual(settings.api_port, 8000)

    @patch("backend.services.supabase.create_client")
    def test_client_creation_uses_server_side_configuration(
        self,
        create_client_mock: Mock,
    ) -> None:
        expected_client = object()
        create_client_mock.return_value = expected_client
        settings = Settings(
            _env_file=None,
            supabase_url="https://example.supabase.co",
            supabase_service_role_key="server-only-test-key",
        )

        client = create_supabase_client(settings)

        self.assertIs(client, expected_client)
        create_client_mock.assert_called_once_with(
            "https://example.supabase.co",
            "server-only-test-key",
        )

    def test_client_creation_rejects_missing_server_configuration(self) -> None:
        settings = Settings(_env_file=None)

        with self.assertRaisesRegex(SupabaseConfigurationError, "SUPABASE_URL"):
            create_supabase_client(settings)

        with self.assertRaisesRegex(
            SupabaseConfigurationError,
            "SUPABASE_SERVICE_ROLE_KEY",
        ):
            create_supabase_client(
                Settings(
                    _env_file=None,
                    supabase_url="https://example.supabase.co",
                )
            )


if __name__ == "__main__":
    unittest.main()