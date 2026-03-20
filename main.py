from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, text
from models import engine

app = FastAPI()

# Add middleware to prevent caching of static files
@app.middleware("http")
async def add_cache_control_header(request, call_next):
    response = await call_next(request)
    # Don't cache static assets
    if request.url.path.endswith(('.js', '.css', '.html')):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

@app.get("/years")
async def get_years():
    """Return a sorted list of all years in the baseball database."""
    with Session(engine) as session:
        # Use raw SQL to get distinct years from the Team table
        result = session.exec(text("SELECT DISTINCT yearID FROM teams ORDER BY yearID")).all()
        years_list = [row[0] for row in result]
        return {"years": years_list}

@app.get("/teams")
async def get_teams(year: int):
    """Return a list of teams with details for a given year."""
    with Session(engine) as session:
        # Query teams table for the specified year
        result = session.exec(text("SELECT teamID, name, lgID, divID FROM teams WHERE yearID = :year ORDER BY name").bindparams(year=year)).all()
        teams_list = [{"teamID": row[0], "name": row[1], "league": row[2], "division": row[3]} for row in result]
        return {"teams": teams_list, "year": year}

@app.get("/players")
async def get_players(year: int, teamID: str):
    """Return a list of players for a given team and year."""
    with Session(engine) as session:
        # Query batting and people tables to get player names
        result = session.exec(text("SELECT DISTINCT p.nameFirst, p.nameLast FROM batting b JOIN people p ON b.playerID = p.playerID WHERE b.yearID = :year AND b.teamID = :teamID ORDER BY p.nameLast, p.nameFirst").bindparams(year=year, teamID=teamID)).all()
        players_list = [{"firstName": row[0], "lastName": row[1]} for row in result]
        return {"players": players_list, "team": teamID, "year": year}

app.mount("/", StaticFiles(directory="static", html=True), name="static")