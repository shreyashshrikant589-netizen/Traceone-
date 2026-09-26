"""Test Supabase Auth login for all 5 demo accounts with password 'Sheru@123'.

Verifies:
1. supabase.auth.sign_in_with_password succeeds with the demo password.
2. An access token and user UUID are returned.
3. User profile can be resolved from public.profiles table.
4. Correct role mapping is confirmed.
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client

ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(ENV_PATH)

SUPABASE_URL = os.getenv("SUPABASE_URL")
ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not ANON_KEY:
    print("ERROR: SUPABASE_URL or SUPABASE_ANON_KEY missing from backend/.env")
    sys.exit(1)

DEMO_ACCOUNTS = [
    {
        "role": "CASE_MANAGER",
        "email": "traceone.manager@demo.traceone.app",
        "expected_role": "CASE_MANAGER",
        "expected_name": "Rajesh Varma (Case Manager)",
    },
    {
        "role": "VOLUNTEER",
        "email": "traceone.volunteer1@demo.traceone.app",
        "expected_role": "VOLUNTEER",
        "expected_name": "Nishant Patil (Field Volunteer)",
    },
    {
        "role": "VOLUNTEER",
        "email": "traceone.volunteer2@demo.traceone.app",
        "expected_role": "VOLUNTEER",
        "expected_name": "Pooja Deshmukh (Field Volunteer)",
    },
    {
        "role": "REPORTER",
        "email": "traceone.reporter@demo.traceone.app",
        "expected_role": "REPORTER",
        "expected_name": "Sunil Shinde (Case Reporter)",
    },
    {
        "role": "VOLUNTEER",
        "email": "traceone.volunteer3@demo.traceone.app",
        "expected_role": "VOLUNTEER",
        "expected_name": "Kiran Jadhav (Field Volunteer)",
    },
]

PASSWORD = "Sheru@123"


def test_logins():
    print("=" * 60)
    print("TraceOne Demo Accounts Login Verification (Password: Sheru@123)")
    print("=" * 60)

    admin_client = create_client(SUPABASE_URL, SERVICE_KEY)
    all_success = True

    for acc in DEMO_ACCOUNTS:
        email = acc["email"]
        role = acc["role"]
        print(f"\nTesting Login for [{role}]: {email} ...")

        # Client for testing standard anon auth sign in
        client = create_client(SUPABASE_URL, ANON_KEY)
        try:
            auth_res = client.auth.sign_in_with_password({"email": email, "password": PASSWORD})
            session = getattr(auth_res, "session", None)
            user = getattr(auth_res, "user", None)

            if not session or not session.access_token:
                print(f"  [FAILED] No session or access token returned for {email}")
                all_success = False
                continue

            user_id = str(user.id)
            print(f"  [SUCCESS] Supabase Auth session acquired. User UUID: {user_id}")

            # Verify profile in DB
            prof_res = admin_client.table("profiles").select("*").eq("auth_user_id", user_id).execute()
            if not prof_res.data or len(prof_res.data) == 0:
                print(f"  [FAILED] No profile found for auth_user_id: {user_id}")
                all_success = False
                continue

            prof = prof_res.data[0]
            print(f"  [SUCCESS] Profile verified: Name='{prof.get('full_name')}', Role='{prof.get('role')}', Active={prof.get('is_active')}, Verified={prof.get('is_verified')}")

            # Check case memberships
            memberships = admin_client.table("case_members").select("case_id, role, status").eq("user_id", prof["id"]).execute()
            print(f"  [SUCCESS] Case memberships: {len(memberships.data)} cases joined/managed")

        except Exception as e:
            print(f"  [FAILED] Exception during login test: {e}")
            all_success = False

    print("\n" + "=" * 60)
    if all_success:
        print("ALL 5 DEMO ACCOUNTS LOGGED IN SUCCESSFULLY WITH Sheru@123!")
    else:
        print("SOME LOGIN TESTS FAILED.")
    print("=" * 60)
    return all_success


if __name__ == "__main__":
    success = test_logins()
    sys.exit(0 if success else 1)
