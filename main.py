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
        # Query batting and people tables to get player names and IDs
        result = session.exec(text("SELECT DISTINCT p.playerID, p.nameFirst, p.nameLast FROM batting b JOIN people p ON b.playerID = p.playerID WHERE b.yearID = :year AND b.teamID = :teamID ORDER BY p.nameLast, p.nameFirst").bindparams(year=year, teamID=teamID)).all()
        players_list = [{"playerID": row[0], "firstName": row[1], "lastName": row[2]} for row in result]
        return {"players": players_list, "team": teamID, "year": year}

@app.get("/player/{playerID}")
async def get_player_details(playerID: str, year: int):
    """Return biographical data and stats for a specific player in a given year."""
    with Session(engine) as session:
        # Get biographical data
        bio_result = session.exec(text("SELECT nameFirst, nameLast, birthYear, birthMonth, birthDay, birthCity, birthState, birthCountry, weight, height, bats, throws, debut, finalGame FROM people WHERE playerID = :playerID").bindparams(playerID=playerID)).first()
        
        if not bio_result:
            return {"error": "Player not found"}
        
        bio_data = {
            "nameFirst": bio_result[0],
            "nameLast": bio_result[1],
            "birthYear": bio_result[2],
            "birthMonth": bio_result[3],
            "birthDay": bio_result[4],
            "birthCity": bio_result[5],
            "birthState": bio_result[6],
            "birthCountry": bio_result[7],
            "weight": bio_result[8],
            "height": bio_result[9],
            "bats": bio_result[10],
            "throws": bio_result[11],
            "debut": bio_result[12],
            "finalGame": bio_result[13]
        }
        
        # Get batting stats for the year
        stats_result = session.exec(text("SELECT G, AB, R, H, \"2B\", \"3B\", HR, RBI, SB, CS, BB, SO, IBB, HBP, SH, SF, GIDP FROM batting WHERE playerID = :playerID AND yearID = :year").bindparams(playerID=playerID, year=year)).all()
        
        stats_data = []
        for row in stats_result:
            stats_data.append({
                "G": row[0],
                "AB": row[1],
                "R": row[2],
                "H": row[3],
                "2B": row[4],
                "3B": row[5],
                "HR": row[6],
                "RBI": row[7],
                "SB": row[8],
                "CS": row[9],
                "BB": row[10],
                "SO": row[11],
                "IBB": row[12],
                "HBP": row[13],
                "SH": row[14],
                "SF": row[15],
                "GIDP": row[16]
            })
        
        return {"bio": bio_data, "stats": stats_data}

app.mount("/", StaticFiles(directory="static", html=True), name="static")