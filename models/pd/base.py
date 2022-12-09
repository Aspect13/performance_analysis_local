from datetime import datetime

from pydantic import BaseModel
from typing import Optional, List


class AnalysisAggregations(BaseModel):
    min: float
    max: float
    mean: float
    pct50: float
    pct75: float
    pct90: float
    pct95: float
    pct99: float


class BaseAnalysisModel(BaseModel):
    id: int
    group: str
    name: str
    start_time: datetime
    test_type: str
    test_env: str
    status: str
    duration: int
    tags: Optional[List[str]] = []
