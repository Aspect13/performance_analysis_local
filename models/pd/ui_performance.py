from pydantic import BaseModel, validator, parse_obj_as, root_validator

from .base import AnalysisAggregations, BaseAnalysisModel


class UIAnalysisMetrics(BaseModel):
    total: AnalysisAggregations
    time_to_first_byte: AnalysisAggregations
    time_to_first_paint: AnalysisAggregations
    dom_content_loading: AnalysisAggregations
    dom_processing: AnalysisAggregations
    # speed_index: AnalysisAggregations
    time_to_interactive: AnalysisAggregations
    first_contentful_paint: AnalysisAggregations
    largest_contentful_paint: AnalysisAggregations
    # cumulative_layout_shift: AnalysisAggregations
    total_blocking_time: AnalysisAggregations
    first_visual_change: AnalysisAggregations
    last_visual_change: AnalysisAggregations

    # <option value="total">Total Time</option>
    # <option value="speed_index">Speed Index</option>
    # <option value="cumulative_layout_shift">Cumulative Layout Shift</option>

    # load_time = Column(JSON, unique=False, nullable=True)


class UIAnalysisModel(BaseAnalysisModel):
    metrics: UIAnalysisMetrics

    @root_validator(pre=True)
    def set_nested_data(cls, values: dict) -> dict:
        if not values.get('metrics'):
            values['metrics'] = cls.__fields__['metrics'].type_.parse_obj(values)
        return values
