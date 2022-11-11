from pydantic import BaseModel, validator, parse_obj_as, root_validator
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
    start_time: str
    test_type: str
    test_env: str
    status: str
    duration: int
    tags: Optional[List[str]] = []
