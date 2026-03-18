from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI
from sqlmodel import Session, text
from models import engine

app = FastAPI()

@app.get("/years")
async def get_years():
    """Return a sorted list of all years in the baseball database."""
    with Session(engine) as session:
        # Use raw SQL to get distinct years from the Team table
        result = session.exec(text("SELECT DISTINCT yearID FROM teams ORDER BY yearID")).all()
        years_list = [row[0] for row in result]
        return {"years": years_list}



app.mount("/", StaticFiles(directory="static", html=True), name="static")