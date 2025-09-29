"""
---------------------------------------------------------------------------
File:        db_helper.py
Description: helper for uploading geopackage files to DB easily
Notes:       -
---------------------------------------------------------------------------
"""

import geopandas as gpd
from sqlalchemy import create_engine
import json

with open("../config.json") as f:
    config = json.load(f)

db_user = config["database"]["user"]
db_password = config["database"]["password"]
db_host = config["database"]["host"]
db_port = config["database"]["port"]

gdf = gpd.read_file("/Users/marinawiemers/Downloads/Cykelparkering_Punkt.gpkg")
engine = create_engine(f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/ag2417_25")
gdf.to_postgis("cykelparkering", engine, schema="ag2417_25_g1", if_exists="replace")

