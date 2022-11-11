#!/usr/bin/python3
# coding=utf-8

#   Copyright 2022 getcarrier.io
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

""" Module """
from collections import defaultdict

from pylon.core.tools import module, log
# from pylon.core.tools.context import Context as Holder  # pylint: disable=E0401

from tools import theme


class Module(module.ModuleModel):
    """ Pylon module """

    def __init__(self, context, descriptor):
        self.context = context
        self.descriptor = descriptor
        # self.group_mapping = {
        #     'backend_performance': 'Backend',
        #     'ui_performance': 'UI'
        # }
        # self.group_mapping_reversed = defaultdict(set)
        # for k, v in self.group_mapping.items():
        #     self.group_mapping_reversed[v].add(k)

    def init(self):
        """ Init module """
        log.info("Initializing module")
        self.descriptor.init_blueprint()

        # Theme registration
        try:
            theme.register_section(
                "performance",
                "Performance",
                kind="holder",
                location="left",
            )
        except:
            ...

        theme.register_subsection(
            "performance", "analysis",
            "Analysis",
            title="Analysis",
            kind="slot",
            prefix="performance_analysis_",
            weight=4,
        )

        theme.register_page(
            "performance", "analysis",
            "compare",
            title="Tests Comparison",
            kind="slot",
            prefix="performance_analysis_compare_",
        )
        self.descriptor.init_rpcs()
        self.descriptor.init_api()
        self.descriptor.init_slots()
        # self.descriptor.init_sio()

    def deinit(self):  # pylint: disable=R0201
        """ De-init module """
        log.info("De-initializing module")
        # De-init slots
        # self.descriptor.deinit_slots()
        # De-init blueprint
        # self.descriptor.deinit_blueprint()
        # De-init SocketIO
        # self.descriptor.deinit_sio()
        # De-init API
        # self.descriptor.deinit_api()
        # De-init RPCs
        # self.descriptor.deinit_rpcs()

    # @property
    # def active_plugins(self) -> set:
    #     return {'backend_performance', 'ui_performance'}

    # @property
    # def groups(self) -> set:
    #     return set(self.group_mapping[i] for i in self.active_plugins if i in self.group_mapping)
