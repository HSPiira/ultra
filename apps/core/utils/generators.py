from cuid2 import Cuid


# ---------------------------------------------------------------------
# Helper: Generate CUID for unique identifiers
# ---------------------------------------------------------------------
def generate_cuid() -> str:
    return Cuid().generate()
