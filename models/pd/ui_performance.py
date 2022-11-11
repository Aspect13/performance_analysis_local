from pydantic import BaseModel, validator, parse_obj_as, root_validator

from .base import AnalysisAggregations, BaseAnalysisModel


class UIAnalysisMetrics(BaseModel):
    total: AnalysisAggregations


class UIAnalysisModel(BaseAnalysisModel):
    metrics: UIAnalysisMetrics

    @root_validator(pre=True)
    def set_nested_data(cls, values: dict) -> dict:
        if not values.get('metrics'):
            values['metrics'] = cls.__fields__['metrics'].type_.parse_obj(values)
        return values
