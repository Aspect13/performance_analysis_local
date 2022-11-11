from typing import Iterable, Union

from .models.pd.backend_performance import BackendAnalysisModel
from .models.pd.ui_performance import UIAnalysisModel


def process_query_result(plugin, query_data) -> Iterable[Union[BackendAnalysisModel, UIAnalysisModel]]:
    serializers_map = {
        'backend_performance': BackendAnalysisModel,
        'ui_performance': UIAnalysisModel
    }
    model = serializers_map[plugin]
    return (
        model.parse_obj(i)
        for i in query_data
    )
