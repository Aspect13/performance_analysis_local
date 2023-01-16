from pydantic import BaseModel, validator, parse_obj_as, root_validator
from typing import Optional


from .base import AnalysisAggregations, BaseAnalysisModel


class BackendAnalysisMetrics(BaseModel):
    total: int
    failures: int
    throughput: float
    error_rate: Optional[float]

    @validator('error_rate', always=True, pre=True, check_fields=False)
    def compute_error_rate(cls, value: float, values: dict) -> float:
        if value:
            return value
        try:
            return round((values['failures'] / values['total']) * 100, 2)
        except ZeroDivisionError:
            return 0


def aggregation_alias(name: str) -> str:
    return f'aggregation_{name}'


class BackendAnalysisAggregations(AnalysisAggregations):
    class Config:
        alias_generator = aggregation_alias


class BackendAnalysisModel(BaseAnalysisModel):
    metrics: BackendAnalysisMetrics
    aggregations: Optional[BackendAnalysisAggregations] = {}
    build_id: str

    @root_validator(pre=True)
    def set_nested_data(cls, values: dict) -> dict:
        if not values.get('metrics'):
            values['metrics'] = cls.__fields__['metrics'].type_.parse_obj(values)
        if not values.get('aggregations'):
            values['aggregations'] = cls.__fields__['aggregations'].type_.parse_obj(values)
        return values
