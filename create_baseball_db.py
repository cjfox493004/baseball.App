#!/usr/bin/env python3
"""Create a SQLite database (baseball.db) from the CSV files in this repo.

Tables created:
  - people (primary key: playerID)
  - teams (primary key: teamID, yearID)
  - batting (primary key: playerID, yearID, stint)

Foreign keys:
  - batting.playerID -> people.playerID
  - batting.(teamID, yearID) -> teams.(teamID, yearID)

This script preserves numeric types where possible (integers as INTEGER, floats as REAL).
"""

import os
import sqlite3

import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "baseball.db")

CSV_PEOPLE = os.path.join(BASE_DIR, "people.csv")
CSV_TEAMS = os.path.join(BASE_DIR, "teams.csv")
CSV_BATTING = os.path.join(BASE_DIR, "Batting.csv")

# Remove existing database so we cleanly build from CSVs.
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)

# Helper for converting pandas values into sqlite-friendly python scalars.
# We want ints to stay ints, floats to stay floats, and missing values to be None.

def _normalize_value(v):
    if pd.isna(v):
        return None
    # Convert numpy scalar types to native python scalars.
    if hasattr(v, "item"):
        try:
            v = v.item()
        except Exception:
            pass
    return v


def _df_to_records(df):
    # Replace NaN/NaT with None, then yield row tuples.
    df = df.where(pd.notnull(df), None)
    for row in df.itertuples(index=False, name=None):
        yield tuple(_normalize_value(v) for v in row)


def main():
    # Load CSVs. Use low_memory=False to avoid dtype inference warnings.
    people = pd.read_csv(CSV_PEOPLE, low_memory=False)
    teams = pd.read_csv(CSV_TEAMS, low_memory=False)
    batting = pd.read_csv(CSV_BATTING, low_memory=False)

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")

    cur = conn.cursor()

    # Create tables with explicit schema.
    cur.execute(
        """
        CREATE TABLE people (
            playerID TEXT PRIMARY KEY,
            ID INTEGER,
            birthYear INTEGER,
            birthMonth INTEGER,
            birthDay INTEGER,
            birthCity TEXT,
            birthCountry TEXT,
            birthState TEXT,
            deathYear INTEGER,
            deathMonth INTEGER,
            deathDay INTEGER,
            deathCountry TEXT,
            deathState TEXT,
            deathCity TEXT,
            nameFirst TEXT,
            nameLast TEXT,
            nameGiven TEXT,
            weight INTEGER,
            height INTEGER,
            bats TEXT,
            throws TEXT,
            debut TEXT,
            bbrefID TEXT,
            finalGame TEXT,
            retroID TEXT
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE teams (
            teamID TEXT,
            yearID INTEGER,
            lgID TEXT,
            franchID TEXT,
            divID TEXT,
            Rank INTEGER,
            G INTEGER,
            Ghome INTEGER,
            W INTEGER,
            L INTEGER,
            DivWin TEXT,
            WCWin TEXT,
            LgWin TEXT,
            WSWin TEXT,
            R INTEGER,
            AB INTEGER,
            H INTEGER,
            "2B" INTEGER,
            "3B" INTEGER,
            HR INTEGER,
            BB INTEGER,
            SO INTEGER,
            SB INTEGER,
            CS INTEGER,
            HBP INTEGER,
            SF INTEGER,
            RA INTEGER,
            ER INTEGER,
            ERA REAL,
            CG INTEGER,
            SHO INTEGER,
            SV INTEGER,
            IPouts INTEGER,
            HA INTEGER,
            HRA INTEGER,
            BBA INTEGER,
            SOA INTEGER,
            E INTEGER,
            DP INTEGER,
            FP REAL,
            name TEXT,
            park TEXT,
            attendance INTEGER,
            BPF REAL,
            PPF REAL,
            teamIDBR TEXT,
            teamIDlahman45 TEXT,
            teamIDretro TEXT,
            PRIMARY KEY (teamID, yearID)
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE batting (
            playerID TEXT,
            yearID INTEGER,
            stint INTEGER,
            teamID TEXT,
            lgID TEXT,
            G INTEGER,
            AB INTEGER,
            R INTEGER,
            H INTEGER,
            "2B" INTEGER,
            "3B" INTEGER,
            HR INTEGER,
            RBI INTEGER,
            SB INTEGER,
            CS INTEGER,
            BB INTEGER,
            SO INTEGER,
            IBB INTEGER,
            HBP INTEGER,
            SH INTEGER,
            SF INTEGER,
            GIDP INTEGER,
            PRIMARY KEY (playerID, yearID, stint),
            FOREIGN KEY (playerID) REFERENCES people(playerID),
            FOREIGN KEY (teamID, yearID) REFERENCES teams(teamID, yearID)
        )
        """
    )

    # Insert data.
    def _quote_col(col: str) -> str:
        # SQLite allows unquoted identifiers but columns that start with a digit (e.g. "2B")
        # must be quoted.
        if col[0].isdigit():
            return f'"{col}"'
        return col

    def _insert_df(table: str, columns: list[str], df: pd.DataFrame) -> None:
        quoted_cols = [ _quote_col(c) for c in columns ]
        placeholders = ",".join(["?" for _ in columns])
        sql = f"INSERT INTO {table} ({', '.join(quoted_cols)}) VALUES ({placeholders})"
        cur.executemany(sql, _df_to_records(df[columns]))

    _insert_df(
        "people",
        [
            "playerID",
            "ID",
            "birthYear",
            "birthMonth",
            "birthDay",
            "birthCity",
            "birthCountry",
            "birthState",
            "deathYear",
            "deathMonth",
            "deathDay",
            "deathCountry",
            "deathState",
            "deathCity",
            "nameFirst",
            "nameLast",
            "nameGiven",
            "weight",
            "height",
            "bats",
            "throws",
            "debut",
            "bbrefID",
            "finalGame",
            "retroID",
        ],
        people,
    )

    _insert_df(
        "teams",
        [
            "teamID",
            "yearID",
            "lgID",
            "franchID",
            "divID",
            "Rank",
            "G",
            "Ghome",
            "W",
            "L",
            "DivWin",
            "WCWin",
            "LgWin",
            "WSWin",
            "R",
            "AB",
            "H",
            "2B",
            "3B",
            "HR",
            "BB",
            "SO",
            "SB",
            "CS",
            "HBP",
            "SF",
            "RA",
            "ER",
            "ERA",
            "CG",
            "SHO",
            "SV",
            "IPouts",
            "HA",
            "HRA",
            "BBA",
            "SOA",
            "E",
            "DP",
            "FP",
            "name",
            "park",
            "attendance",
            "BPF",
            "PPF",
            "teamIDBR",
            "teamIDlahman45",
            "teamIDretro",
        ],
        teams,
    )

    _insert_df(
        "batting",
        [
            "playerID",
            "yearID",
            "stint",
            "teamID",
            "lgID",
            "G",
            "AB",
            "R",
            "H",
            "2B",
            "3B",
            "HR",
            "RBI",
            "SB",
            "CS",
            "BB",
            "SO",
            "IBB",
            "HBP",
            "SH",
            "SF",
            "GIDP",
        ],
        batting,
    )

    conn.commit()
    conn.close()

    print(f"Created {DB_PATH} with tables: people, teams, batting")


if __name__ == "__main__":
    main()
