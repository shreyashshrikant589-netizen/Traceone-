"""TraceOne Complete Database Population & Real Supabase Auth Demo Provisioning.

This script:
1. Connects to Supabase using the service role key from backend/.env.
2. Creates/verifies 5 real Supabase Auth accounts with password 'Sheru@123'
   - Manager: traceone.manager@demo.traceone.app
   - Volunteer 1: traceone.volunteer1@demo.traceone.app
   - Volunteer 2: traceone.volunteer2@demo.traceone.app
   - Reporter: traceone.reporter@demo.traceone.app
   - Volunteer 3: traceone.volunteer3@demo.traceone.app
3. Preserves existing real users without modification.
4. Idempotently creates profiles for each demo user.
5. Idempotently populates 5 realistic cases:
   - Aarohi Sharma (TO-2048, Active / Local Search, High Priority)
   - Meera Kapoor (TO-2042, Public Search, Critical Priority)
   - Ishita Rao (TO-2035, Public Search, High Priority)
   - Kavya Menon (TO-2019, Search Completed, Standard Priority)
   - Riya Das (TO-2004, Case Resolved, Standard Priority)
6. Populates missing persons, case memberships, zones, search sessions,
   evidence, witness reports, timeline events, notifications, case settings,
   case invites (with 6-digit code '842-195'), case publications, police notifications,
   AI search priorities, possible matches, search expansions, and volunteer locations.
"""

from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
import sys
import uuid
from dotenv import load_dotenv
from supabase import create_client

# Load backend/.env
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(ENV_PATH)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SERVICE_KEY:
    print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from backend/.env")
    sys.exit(1)

client = create_client(SUPABASE_URL, SERVICE_KEY)

DEMO_PASSWORD = "Sheru@123"

DEMO_USERS_CONFIG = [
    {
        "key": "manager",
        "email": "traceone.manager@demo.traceone.app",
        "full_name": "Rajesh Varma (Case Manager)",
        "role": "CASE_MANAGER",
        "phone": "+919820011221",
    },
    {
        "key": "volunteer1",
        "email": "traceone.volunteer1@demo.traceone.app",
        "full_name": "Nishant Patil (Field Volunteer)",
        "role": "VOLUNTEER",
        "phone": "+919820011222",
    },
    {
        "key": "volunteer2",
        "email": "traceone.volunteer2@demo.traceone.app",
        "full_name": "Pooja Deshmukh (Field Volunteer)",
        "role": "VOLUNTEER",
        "phone": "+919820011223",
    },
    {
        "key": "reporter",
        "email": "traceone.reporter@demo.traceone.app",
        "full_name": "Sunil Shinde (Case Reporter)",
        "role": "REPORTER",
        "phone": "+919820011224",
    },
    {
        "key": "volunteer3",
        "email": "traceone.volunteer3@demo.traceone.app",
        "full_name": "Kiran Jadhav (Field Volunteer)",
        "role": "VOLUNTEER",
        "phone": "+919820011225",
    },
]


def sha256_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def get_or_create_auth_user(config: dict) -> tuple[str, bool]:
    """Returns (auth_user_id, created_flag)."""
    email = config["email"]
    # List existing users
    res = client.auth.admin.list_users()
    users = getattr(res, "users", res)
    for u in users:
        if u.email.lower() == email.lower():
            # Update password to ensure it is Sheru@123
            try:
                client.auth.admin.update_user_by_id(u.id, {"password": DEMO_PASSWORD, "email_confirm": True})
            except Exception as e:
                print(f"  Note: user password update for {email}: {e}")
            return str(u.id), False

    # Create new auth user
    user_attrs = {
        "email": email,
        "password": DEMO_PASSWORD,
        "email_confirm": True,
        "user_metadata": {
            "full_name": config["full_name"],
            "role": config["role"],
        },
    }
    new_user = client.auth.admin.create_user(user_attrs)
    user_obj = getattr(new_user, "user", new_user)
    return str(user_obj.id), True


def ensure_profile(auth_user_id: str, config: dict) -> dict:
    """Ensures profile exists for given auth_user_id."""
    existing = client.table("profiles").select("*").eq("auth_user_id", auth_user_id).execute()
    now_iso = datetime.now(timezone.utc).isoformat()
    if existing.data and len(existing.data) > 0:
        p = existing.data[0]
        # Update details if needed
        client.table("profiles").update({
            "full_name": config["full_name"],
            "role": config["role"],
            "email": config["email"],
            "phone": config["phone"],
            "is_active": True,
            "is_verified": True,
            "updated_at": now_iso,
        }).eq("id", p["id"]).execute()
        return p

    profile_id = str(uuid.uuid4())
    row = {
        "id": profile_id,
        "auth_user_id": auth_user_id,
        "full_name": config["full_name"],
        "email": config["email"],
        "phone": config["phone"],
        "role": config["role"],
        "avatar_url": None,
        "is_active": True,
        "is_verified": True,
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    inserted = client.table("profiles").insert(row).execute()
    return inserted.data[0] if inserted.data else row


def run_seed():
    print("=" * 60)
    print("TraceOne Database Seeding & Demo Auth Accounts Provisioning")
    print("=" * 60)

    # 1. Provision Auth Users and Profiles
    print("\n[Step 1/6] Provisioning Supabase Auth Accounts & Profiles...")
    profiles_by_key = {}
    for cfg in DEMO_USERS_CONFIG:
        auth_id, created = get_or_create_auth_user(cfg)
        status_txt = "CREATED" if created else "EXISTS (password synced)"
        print(f"  * {cfg['role']}: {cfg['email']} -> {status_txt}")
        prof = ensure_profile(auth_id, cfg)
        profiles_by_key[cfg["key"]] = prof

    mgr_prof = profiles_by_key["manager"]
    vol1_prof = profiles_by_key["volunteer1"]
    vol2_prof = profiles_by_key["volunteer2"]
    vol3_prof = profiles_by_key["volunteer3"]
    rep_prof = profiles_by_key["reporter"]

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # 2. Cases definition
    print("\n[Step 2/6] Populating Demo Cases & Missing Persons...")
    cases_data = [
        {
            "key": "case1",
            "case_number": "TO-2048",
            "title": "Aarohi Sharma",
            "description": "24 yr female missing near North District · Community Park. Blue denim jacket, black backpack.",
            "status": "LOCAL_SEARCH",
            "priority": "HIGH",
            "event_name": "Community Park Search",
            "venue_name": "North District · Community Park",
            "known_destination": "Expected at Central Library",
            "last_seen_at": (now - timedelta(hours=2, minutes=30)).isoformat(),
            "initial_radius_m": 2500,
            "current_radius_m": 3500,
            "is_public": False,
            "created_by": mgr_prof["id"],
            "case_manager_id": mgr_prof["id"],
            "missing_person": {
                "full_name": "Aarohi Sharma",
                "age": 24,
                "gender": "Female",
                "clothing_description": "Blue denim jacket, white sneakers, black backpack",
                "physical_description": "Long dark hair, approximately 165 cm, small birthmark near left cheek.",
                "known_destination": "Expected at Central Library",
                "additional_information": "Last spotted walking north toward transit entrance.",
            },
        },
        {
            "key": "case2",
            "case_number": "TO-2042",
            "title": "Meera Kapoor",
            "description": "31 yr female last seen near Riverside East Gate 2. Public escalation approved.",
            "status": "PUBLIC_SEARCH",
            "priority": "CRITICAL",
            "event_name": "Riverside Search Operation",
            "venue_name": "Riverside East · Gate 2",
            "known_destination": "Riverside Promenade",
            "last_seen_at": (now - timedelta(days=1, hours=3)).isoformat(),
            "initial_radius_m": 3000,
            "current_radius_m": 5000,
            "is_public": True,
            "public_at": (now - timedelta(hours=4)).isoformat(),
            "created_by": rep_prof["id"],
            "case_manager_id": mgr_prof["id"],
            "missing_person": {
                "full_name": "Meera Kapoor",
                "age": 31,
                "gender": "Female",
                "clothing_description": "Dark maroon sweater, brown leather boots",
                "physical_description": "Medium build, 160 cm, framed spectacles.",
                "known_destination": "Riverside Promenade",
                "additional_information": "High priority alert issued across regional transit network.",
            },
        },
        {
            "key": "case3",
            "case_number": "TO-2035",
            "title": "Ishita Rao",
            "description": "19 yr female last seen near Central Market. Active community coordination.",
            "status": "PUBLIC_SEARCH",
            "priority": "HIGH",
            "event_name": "Central Market Area Search",
            "venue_name": "Central Market · Sector 4",
            "known_destination": "Metro Station",
            "last_seen_at": (now - timedelta(days=3)).isoformat(),
            "initial_radius_m": 2000,
            "current_radius_m": 2000,
            "is_public": True,
            "public_at": (now - timedelta(days=2)).isoformat(),
            "created_by": mgr_prof["id"],
            "case_manager_id": mgr_prof["id"],
            "missing_person": {
                "full_name": "Ishita Rao",
                "age": 19,
                "gender": "Female",
                "clothing_description": "Yellow hoodie and grey trousers",
                "physical_description": "Slender, 158 cm.",
                "known_destination": "Metro Station",
                "additional_information": "Witness sighting near transit junction under review.",
            },
        },
        {
            "key": "case4",
            "case_number": "TO-2019",
            "title": "Kavya Menon",
            "description": "28 yr female last seen West Station. Search concluded.",
            "status": "LOCAL_SEARCH_COMPLETED",
            "priority": "MEDIUM",
            "event_name": "West Station Search",
            "venue_name": "West Station · Platform 3",
            "known_destination": "West Terminal",
            "last_seen_at": (now - timedelta(days=7)).isoformat(),
            "initial_radius_m": 1500,
            "current_radius_m": 1500,
            "is_public": False,
            "created_by": mgr_prof["id"],
            "case_manager_id": mgr_prof["id"],
            "missing_person": {
                "full_name": "Kavya Menon",
                "age": 28,
                "gender": "Female",
                "clothing_description": "Grey trench coat",
                "physical_description": "170 cm, short black hair.",
                "known_destination": "West Terminal",
                "additional_information": "All zones searched and verified.",
            },
        },
        {
            "key": "case5",
            "case_number": "TO-2004",
            "title": "Riya Das",
            "description": "36 yr female found safely and reunited with family.",
            "status": "RESOLVED",
            "priority": "LOW",
            "event_name": "Lake Road Search",
            "venue_name": "Lake Road · East Shore",
            "known_destination": "East Shore Clinic",
            "last_seen_at": (now - timedelta(days=14)).isoformat(),
            "resolved_at": (now - timedelta(days=12)).isoformat(),
            "initial_radius_m": 1000,
            "current_radius_m": 1000,
            "is_public": False,
            "created_by": mgr_prof["id"],
            "case_manager_id": mgr_prof["id"],
            "missing_person": {
                "full_name": "Riya Das",
                "age": 36,
                "gender": "Female",
                "clothing_description": "Green sweater, blue jeans",
                "physical_description": "162 cm.",
                "known_destination": "East Shore Clinic",
                "additional_information": "Case successfully resolved and closed.",
            },
        },
    ]

    cases_by_key = {}
    for cd in cases_data:
        existing = client.table("cases").select("*").eq("case_number", cd["case_number"]).execute()
        if existing.data and len(existing.data) > 0:
            c = existing.data[0]
            print(f"  * Case {cd['case_number']} ({cd['title']}): EXISTS")
        else:
            case_id = str(uuid.uuid4())
            case_row = {
                "id": case_id,
                "case_number": cd["case_number"],
                "created_by": cd["created_by"],
                "case_manager_id": cd["case_manager_id"],
                "title": cd["title"],
                "description": cd["description"],
                "status": cd["status"],
                "priority": cd["priority"],
                "event_name": cd["event_name"],
                "venue_name": cd["venue_name"],
                "known_destination": cd["known_destination"],
                "last_seen_at": cd["last_seen_at"],
                "initial_radius_m": cd["initial_radius_m"],
                "current_radius_m": cd["current_radius_m"],
                "is_public": cd["is_public"],
                "public_at": cd.get("public_at"),
                "resolved_at": cd.get("resolved_at"),
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            inserted = client.table("cases").insert(case_row).execute()
            c = inserted.data[0] if inserted.data else case_row
            print(f"  * Case {cd['case_number']} ({cd['title']}): CREATED")
        cases_by_key[cd["key"]] = c

        # Missing person
        mp_data = cd["missing_person"]
        existing_mp = client.table("missing_persons").select("*").eq("case_id", c["id"]).execute()
        if not existing_mp.data or len(existing_mp.data) == 0:
            client.table("missing_persons").insert({
                "id": str(uuid.uuid4()),
                "case_id": c["id"],
                "full_name": mp_data["full_name"],
                "age": mp_data["age"],
                "gender": mp_data["gender"],
                "clothing_description": mp_data["clothing_description"],
                "physical_description": mp_data["physical_description"],
                "known_destination": mp_data["known_destination"],
                "additional_information": mp_data["additional_information"],
                "created_at": now_iso,
                "updated_at": now_iso,
            }).execute()

    case1 = cases_by_key["case1"]
    case2 = cases_by_key["case2"]

    # 3. Case Memberships
    print("\n[Step 3/6] Linking Case Members...")
    memberships = [
        # Case 1 (Aarohi Sharma)
        {"case_id": case1["id"], "user_id": mgr_prof["id"], "role": "CASE_MANAGER"},
        {"case_id": case1["id"], "user_id": vol1_prof["id"], "role": "VOLUNTEER"},
        {"case_id": case1["id"], "user_id": vol2_prof["id"], "role": "VOLUNTEER"},
        {"case_id": case1["id"], "user_id": vol3_prof["id"], "role": "VOLUNTEER"},
        {"case_id": case1["id"], "user_id": rep_prof["id"], "role": "REPORTER"},
        # Case 2 (Meera Kapoor)
        {"case_id": case2["id"], "user_id": mgr_prof["id"], "role": "CASE_MANAGER"},
        {"case_id": case2["id"], "user_id": rep_prof["id"], "role": "REPORTER"},
        {"case_id": case2["id"], "user_id": vol1_prof["id"], "role": "VOLUNTEER"},
        {"case_id": case2["id"], "user_id": vol2_prof["id"], "role": "VOLUNTEER"},
    ]
    for m in memberships:
        existing_m = client.table("case_members").select("*").eq("case_id", m["case_id"]).eq("user_id", m["user_id"]).execute()
        if not existing_m.data or len(existing_m.data) == 0:
            client.table("case_members").insert({
                "id": str(uuid.uuid4()),
                "case_id": m["case_id"],
                "user_id": m["user_id"],
                "role": m["role"],
                "status": "ACTIVE",
                "joined_at": now_iso,
                "created_at": now_iso,
                "updated_at": now_iso,
            }).execute()
    print("  * Case members linked successfully.")

    # 4. Search Zones & Assignments
    print("\n[Step 4/6] Creating Search Zones, Sessions & AI Priorities...")
    # Base coords: 73.8567, 18.5204 (Pune / North District park area)
    def make_multipolygon_wkt(lng, lat, offset):
        p1 = f"{round(lng - offset, 5)} {round(lat - offset, 5)}"
        p2 = f"{round(lng + offset, 5)} {round(lat - offset, 5)}"
        p3 = f"{round(lng + offset, 5)} {round(lat + offset, 5)}"
        p4 = f"{round(lng - offset, 5)} {round(lat + offset, 5)}"
        return f"SRID=4326;MULTIPOLYGON((({p1}, {p2}, {p3}, {p4}, {p1})))"

    zones_data = [
        {
            "name": "Zone A · Community Park",
            "description": "Near last known location and northern walking trail.",
            "status": "ASSIGNED",
            "priority_score": 87.0,
            "priority_rank": 1,
            "assigned_volunteer_id": vol1_prof["id"],
            "geometry": make_multipolygon_wkt(73.8567, 18.5204, 0.004),
        },
        {
            "name": "Zone B · Riverside Trail",
            "description": "Exit proximity and recent witness sighting corridor.",
            "status": "UNSEARCHED",
            "priority_score": 74.0,
            "priority_rank": 2,
            "assigned_volunteer_id": vol2_prof["id"],
            "geometry": make_multipolygon_wkt(73.8610, 18.5240, 0.004),
        },
        {
            "name": "Zone C · Transit Exit",
            "description": "High footfall transit connection corridor.",
            "status": "IN_PROGRESS",
            "priority_score": 61.0,
            "priority_rank": 3,
            "assigned_volunteer_id": vol3_prof["id"],
            "geometry": make_multipolygon_wkt(73.8520, 18.5260, 0.004),
        },
        {
            "name": "Zone D · Market Perimeter",
            "description": "Crowd flow and commercial perimeter area.",
            "status": "REOPEN",
            "priority_score": 48.0,
            "priority_rank": 4,
            "assigned_volunteer_id": None,
            "geometry": make_multipolygon_wkt(73.8650, 18.5180, 0.004),
        },
        {
            "name": "Zone E · North Woods",
            "description": "Dense outer perimeter with secondary trail access.",
            "status": "UNSEARCHED",
            "priority_score": 29.0,
            "priority_rank": 5,
            "assigned_volunteer_id": None,
            "geometry": make_multipolygon_wkt(73.8590, 18.5300, 0.004),
        },
    ]

    zone_records = []
    for zd in zones_data:
        existing_z = client.table("zones").select("*").eq("case_id", case1["id"]).eq("name", zd["name"]).execute()
        if existing_z.data and len(existing_z.data) > 0:
            z_row = existing_z.data[0]
        else:
            z_row = {
                "id": str(uuid.uuid4()),
                "case_id": case1["id"],
                "name": zd["name"],
                "description": zd["description"],
                "geometry": zd["geometry"],
                "status": zd["status"],
                "priority_score": zd["priority_score"],
                "priority_rank": zd["priority_rank"],
                "assigned_volunteer_id": zd["assigned_volunteer_id"],
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            inserted = client.table("zones").insert(z_row).execute()
            z_row = inserted.data[0] if inserted.data else z_row
        zone_records.append(z_row)

        # AI Priority Record
        existing_ai = client.table("ai_search_priorities").select("*").eq("zone_id", z_row["id"]).execute()
        if not existing_ai.data or len(existing_ai.data) == 0:
            client.table("ai_search_priorities").insert({
                "id": str(uuid.uuid4()),
                "case_id": case1["id"],
                "zone_id": z_row["id"],
                "model_version": "v1.2",
                "priority_score": zd["priority_score"],
                "rank": zd["priority_rank"],
                "confidence": 0.88,
                "distance_score": 85.0,
                "time_score": 90.0,
                "crowd_score": 60.0,
                "exit_score": 75.0,
                "witness_score": 82.0,
                "coverage_score": 40.0,
                "direction_score": 78.0,
                "destination_score": 80.0,
                "explanation": f"High priority based on last seen proximity and witness sighting flow for {zd['name']}.",
                "created_at": now_iso,
            }).execute()

    zone_a = zone_records[0]
    zone_c = zone_records[2]

    # Search Sessions
    existing_sess = client.table("search_sessions").select("*").eq("case_id", case1["id"]).execute()
    session_a_id = None
    session_c_id = None
    if existing_sess.data and len(existing_sess.data) > 0:
        session_a_id = existing_sess.data[0]["id"]
        session_c_id = existing_sess.data[1]["id"] if len(existing_sess.data) > 1 else session_a_id
    else:
        sess1_id = str(uuid.uuid4())
        sess2_id = str(uuid.uuid4())
        client.table("search_sessions").insert([
            {
                "id": sess1_id,
                "case_id": case1["id"],
                "zone_id": zone_a["id"],
                "volunteer_id": vol1_prof["id"],
                "status": "ACTIVE",
                "started_at": (now - timedelta(minutes=45)).isoformat(),
                "notes": "Searching north walking path in pairs.",
                "verification_status": "VERIFIED",
                "created_at": now_iso,
                "updated_at": now_iso,
            },
            {
                "id": sess2_id,
                "case_id": case1["id"],
                "zone_id": zone_c["id"],
                "volunteer_id": vol3_prof["id"],
                "status": "ACTIVE",
                "started_at": (now - timedelta(minutes=20)).isoformat(),
                "notes": "Covering transit entrance perimeter.",
                "verification_status": "VERIFIED",
                "created_at": now_iso,
                "updated_at": now_iso,
            },
        ]).execute()
        session_a_id = sess1_id
        session_c_id = sess2_id

    # 5. Evidence, Sightings, Witness Reports, Timeline & Operations
    print("\n[Step 5/6] Seeding Evidence, Sightings, Timeline, Settings & Invites...")
    # Evidence
    existing_ev = client.table("evidence").select("*").eq("case_id", case1["id"]).execute()
    ev1_id = None
    if existing_ev.data and len(existing_ev.data) > 0:
        ev1_id = existing_ev.data[0]["id"]
    else:
        ev1_id = str(uuid.uuid4())
        ev2_id = str(uuid.uuid4())
        client.table("evidence").insert([
            {
                "id": ev1_id,
                "case_id": case1["id"],
                "submitted_by": vol1_prof["id"],
                "evidence_type": "OBSERVATION",
                "description": "Verified black backpack observation matched description.",
                "confidence": 0.92,
                "source": "FIELD_VOLUNTEER",
                "photo_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
                "status": "VERIFIED",
                "occurred_at": (now - timedelta(minutes=30)).isoformat(),
                "created_at": now_iso,
                "updated_at": now_iso,
            },
            {
                "id": ev2_id,
                "case_id": case1["id"],
                "submitted_by": vol2_prof["id"],
                "evidence_type": "OBSERVATION",
                "description": "Footprint impressions observed near muddy park embankment trail.",
                "confidence": 0.75,
                "source": "FIELD_VOLUNTEER",
                "status": "PENDING",
                "occurred_at": (now - timedelta(minutes=15)).isoformat(),
                "created_at": now_iso,
                "updated_at": now_iso,
            },
        ]).execute()

    # Witness reports
    existing_wit = client.table("witness_reports").select("*").eq("case_id", case1["id"]).execute()
    if not existing_wit.data or len(existing_wit.data) == 0:
        client.table("witness_reports").insert([
            {
                "id": str(uuid.uuid4()),
                "case_id": case1["id"],
                "evidence_id": ev1_id,
                "reported_by": vol1_prof["id"],
                "description": "Witness reported seeing someone matching description near the park entrance.",
                "reported_at": (now - timedelta(minutes=25)).isoformat(),
                "observed_at": (now - timedelta(minutes=35)).isoformat(),
                "person_description": "Female matching height, wearing dark denim jacket with backpack.",
                "direction": "North toward the transit entrance",
                "clothing": "Blue denim jacket, white sneakers, black backpack",
                "confidence": 0.85,
                "status": "VERIFIED",
                "created_at": now_iso,
                "updated_at": now_iso,
            },
            {
                "id": str(uuid.uuid4()),
                "case_id": case1["id"],
                "reported_by": rep_prof["id"],
                "description": "Community store attendant observed a young woman asking directions to Central Library.",
                "reported_at": (now - timedelta(minutes=10)).isoformat(),
                "observed_at": (now - timedelta(hours=1)).isoformat(),
                "person_description": "Approximately 20-25 yrs, carry bag.",
                "direction": "East toward library boulevard",
                "clothing": "Denim outfit",
                "confidence": 0.80,
                "status": "VERIFIED",
                "created_at": now_iso,
                "updated_at": now_iso,
            },
        ]).execute()

    # Case Timeline
    existing_tl = client.table("case_timeline").select("*").eq("case_id", case1["id"]).execute()
    if not existing_tl.data or len(existing_tl.data) == 0:
        timeline_events = [
            ("CASE_CREATED", "Case Created", "Missing-person report was submitted and shared with the response team.", 120),
            ("SEARCH_STARTED", "Search Started", "Initial search was activated for the North District.", 100),
            ("VOLUNTEER_JOINED", "Volunteer Joined", "Authorized field volunteers joined the local response team.", 85),
            ("ZONE_ASSIGNED", "Zone Assigned", "Zone A and Zone C were assigned to the field volunteers.", 70),
            ("EVIDENCE_ADDED", "Evidence Added", "Verified black backpack observation was added to the case.", 40),
            ("SIGHTING_REPORTED", "Sighting Reported", "Witness reported sighting near park entrance moving toward transit.", 25),
            ("AI_PRIORITY_UPDATED", "Priority Updated", "Search priority raised to High following reviewed witness sighting.", 15),
        ]
        tl_rows = [
            {
                "id": str(uuid.uuid4()),
                "case_id": case1["id"],
                "actor_id": mgr_prof["id"],
                "event_type": event_type,
                "description": f"{title}: {desc}",
                "metadata": {"title": title, "category": "operational"},
                "created_at": (now - timedelta(minutes=mins_ago)).isoformat(),
            }
            for event_type, title, desc, mins_ago in timeline_events
        ]
        client.table("case_timeline").insert(tl_rows).execute()

    # Notifications
    existing_notif = client.table("notifications").select("*").eq("case_id", case1["id"]).execute()
    if not existing_notif.data or len(existing_notif.data) == 0:
        notif_rows = [
            {
                "id": str(uuid.uuid4()),
                "user_id": vol1_prof["id"],
                "case_id": case1["id"],
                "type": "HIGH_PRIORITY_ZONE",
                "title": "High-Priority Zone",
                "message": "Zone A priority was updated after new evidence.",
                "data": {"priority": "CRITICAL", "zone": "Zone A"},
                "status": "SENT",
                "created_at": (now - timedelta(minutes=5)).isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": vol1_prof["id"],
                "case_id": case1["id"],
                "type": "ZONE_ASSIGNED",
                "title": "Zone Assigned",
                "message": "Zone A was assigned to you for field search.",
                "data": {"zone": "Zone A"},
                "status": "SENT",
                "created_at": (now - timedelta(minutes=18)).isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": mgr_prof["id"],
                "case_id": case1["id"],
                "type": "NEW_SIGHTING",
                "title": "New Sighting",
                "message": "A possible sighting was submitted for human verification.",
                "data": {"confidence": 0.85},
                "status": "SENT",
                "created_at": (now - timedelta(minutes=32)).isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": mgr_prof["id"],
                "case_id": case1["id"],
                "type": "NEW_EVIDENCE",
                "title": "New Evidence",
                "message": "New verified evidence was added to Case TO-2048.",
                "data": {"case_number": "TO-2048"},
                "status": "READ",
                "created_at": (now - timedelta(hours=1)).isoformat(),
            },
        ]
        client.table("notifications").insert(notif_rows).execute()

    # Case Settings
    existing_cs = client.table("case_settings").select("*").eq("case_id", case1["id"]).execute()
    if not existing_cs.data or len(existing_cs.data) == 0:
        client.table("case_settings").insert({
            "id": str(uuid.uuid4()),
            "case_id": case1["id"],
            "allow_public_escalation": True,
            "allow_public_sightings": True,
            "allow_location_sharing": True,
            "allow_photo_reports": True,
            "auto_expire_publication": True,
            "retention_days": 30,
            "created_at": now_iso,
            "updated_at": now_iso,
        }).execute()

    # Case Invites (6-digit code: '842-195' and '842195')
    existing_inv = client.table("case_invites").select("*").eq("case_id", case1["id"]).execute()
    if not existing_inv.data or len(existing_inv.data) == 0:
        join_code_plain = "842195"
        token_plain = "traceone_demo_secure_token_842195"
        client.table("case_invites").insert({
            "id": str(uuid.uuid4()),
            "case_id": case1["id"],
            "created_by": mgr_prof["id"],
            "invite_token_hash": sha256_hash(token_plain),
            "join_code_hash": sha256_hash(join_code_plain),
            "expires_at": (now + timedelta(days=7)).isoformat(),
            "max_uses": 50,
            "used_count": 3,
            "is_active": True,
            "created_at": now_iso,
        }).execute()

    # Case Publications (For Case 2)
    existing_pub = client.table("case_publications").select("*").eq("case_id", case2["id"]).execute()
    if not existing_pub.data or len(existing_pub.data) == 0:
        client.table("case_publications").insert({
            "id": str(uuid.uuid4()),
            "case_id": case2["id"],
            "published_by": mgr_prof["id"],
            "scope": "PUBLIC",
            "reason": "Escalated to public search alert following 24hr without local trail detection.",
            "approved_at": (now - timedelta(hours=4)).isoformat(),
            "expires_at": (now + timedelta(days=5)).isoformat(),
            "status": "ACTIVE",
            "created_at": now_iso,
        }).execute()

    # Police Notification (For Case 1)
    existing_pn = client.table("police_notifications").select("*").eq("case_id", case1["id"]).execute()
    if not existing_pn.data or len(existing_pn.data) == 0:
        client.table("police_notifications").insert({
            "id": str(uuid.uuid4()),
            "case_id": case1["id"],
            "requested_by": mgr_prof["id"],
            "status": "PENDING",
            "reference_id": "PN-2026-0842",
            "created_at": now_iso,
        }).execute()

    # Possible Match (For Case 1)
    existing_pm = client.table("possible_matches").select("*").eq("case_id", case1["id"]).execute()
    if not existing_pm.data or len(existing_pm.data) == 0:
        client.table("possible_matches").insert({
            "id": str(uuid.uuid4()),
            "case_id": case1["id"],
            "reported_by": vol1_prof["id"],
            "source_image_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
            "candidate_image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
            "similarity_score": 0.84,
            "model_version": "deep-face-v2",
            "status": "REVIEW_REQUIRED",
            "created_at": now_iso,
        }).execute()

    # Search Expansion (For Case 1)
    existing_se = client.table("search_expansions").select("*").eq("case_id", case1["id"]).execute()
    if not existing_se.data or len(existing_se.data) == 0:
        client.table("search_expansions").insert({
            "id": str(uuid.uuid4()),
            "case_id": case1["id"],
            "stage": "ROADS_EXITS",
            "previous_radius_m": 2500,
            "new_radius_m": 3500,
            "reason": "High density of unverified witness reports near North Trail Exit.",
            "recommended_by": mgr_prof["id"],
            "status": "RECOMMENDED",
            "created_at": now_iso,
        }).execute()

    # Volunteer Locations
    if session_a_id:
        existing_loc = client.table("volunteer_locations").select("*").eq("case_id", case1["id"]).execute()
        if not existing_loc.data or len(existing_loc.data) == 0:
            client.table("volunteer_locations").insert([
                {
                    "id": str(uuid.uuid4()),
                    "case_id": case1["id"],
                    "volunteer_id": vol1_prof["id"],
                    "session_id": session_a_id,
                    "location": "SRID=4326;POINT(73.8567 18.5204)",
                    "accuracy_m": 12.0,
                    "speed": 1.2,
                    "heading": 45.0,
                    "recorded_at": now_iso,
                    "created_at": now_iso,
                },
                {
                    "id": str(uuid.uuid4()),
                    "case_id": case1["id"],
                    "volunteer_id": vol2_prof["id"],
                    "session_id": session_a_id,
                    "location": "SRID=4326;POINT(73.8580 18.5220)",
                    "accuracy_m": 14.0,
                    "speed": 0.8,
                    "heading": 60.0,
                    "recorded_at": now_iso,
                    "created_at": now_iso,
                },
            ]).execute()

    print("\n[Step 6/6] Database Verification & Summary Count...")
    tables_to_verify = [
        "profiles",
        "cases",
        "missing_persons",
        "case_members",
        "zones",
        "search_sessions",
        "evidence",
        "witness_reports",
        "case_timeline",
        "notifications",
        "case_settings",
        "case_invites",
        "case_publications",
        "police_notifications",
        "ai_search_priorities",
        "possible_matches",
        "search_expansions",
        "volunteer_locations",
        "admins",
    ]

    counts = {}
    for tbl in tables_to_verify:
        try:
            r = client.table(tbl).select("id", count="exact").execute()
            counts[tbl] = r.count
            print(f"  * {tbl.ljust(24)}: {r.count} rows")
        except Exception as e:
            counts[tbl] = f"Error: {e}"
            print(f"  * {tbl.ljust(24)}: {e}")

    print("\n" + "=" * 60)
    print("Seeding Complete Successfully!")
    print("=" * 60)


if __name__ == "__main__":
    run_seed()
