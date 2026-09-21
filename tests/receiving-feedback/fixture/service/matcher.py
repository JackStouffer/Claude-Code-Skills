"""Read path: looks up annotations by target_uid_path. (Synthetic fixture.)"""


def fetch_for_target(conn, target_uid_path):
    return conn.execute(
        "SELECT payload FROM annotations WHERE target_uid_path = %s",
        (target_uid_path,),
    ).fetchall()
