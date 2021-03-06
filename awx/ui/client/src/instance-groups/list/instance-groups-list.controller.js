export default ['$scope', '$filter', '$state', 'Alert', 'resolvedModels', 'Dataset', 'InstanceGroupsStrings','ProcessErrors', 'Prompt', 'Wait',
    function($scope, $filter, $state, Alert, resolvedModels, Dataset, strings, ProcessErrors, Prompt, Wait) {
        const vm = this;
        const { instanceGroup } = resolvedModels;

        vm.strings = strings;
        vm.isSuperuser = $scope.$root.user_is_superuser;

        init();

        function init(){
            $scope.list = {
                iterator: 'instance_group',
                name: 'instance_groups'
            };

            $scope.collection = {
                basePath: 'instance_groups',
                iterator: 'instance_group'
            };

            $scope[`${$scope.list.iterator}_dataset`] = Dataset.data;
            $scope[$scope.list.name] = $scope[`${$scope.list.iterator}_dataset`].results;
            $scope.instanceGroupCount = Dataset.data.count;

            $scope.$on('updateDataset', function(e, dataset) {
                $scope[`${$scope.list.iterator}_dataset`] = dataset;
                $scope[$scope.list.name] = dataset.results;
            });
        }

        $scope.$watch('$state.params.instance_group_id', () => {
            vm.activeId = parseInt($state.params.instance_group_id);
        });

        vm.rowAction = {
            trash: instance_group => {
                return vm.isSuperuser && instance_group.name !== 'tower';
            }
        };

        vm.deleteInstanceGroup = instance_group => {
            if (!instance_group) {
                Alert(strings.get('error.DELETE'), strings.get('alert.MISSING_PARAMETER'));
                return;
            }

            Prompt({
                action() {
                    $('#prompt-modal').modal('hide');
                    Wait('start');
                    instanceGroup
                        .request('delete', instance_group.id)
                        .then(() => handleSuccessfulDelete(instance_group))
                        .catch(createErrorHandler('delete instance group', 'DELETE'))
                        .finally(() => Wait('stop'));
                },
                hdr: strings.get('DELETE'),
                resourceName: $filter('sanitize')(instance_group.name),
                body: `${strings.get('deleteResource.CONFIRM', 'instance group')}`
            });
        };

        function handleSuccessfulDelete(instance_group) {
            if (parseInt($state.params.instance_group_id, 0) === instance_group.id) {
                $state.go('instanceGroups', $state.params, { reload: true });
            } else {
                $state.go('.', $state.params, { reload: true });
            }
        }

        function createErrorHandler(path, action) {
            return ({ data, status }) => {
                const hdr = strings.get('error.HEADER');
                const msg = strings.get('error.CALL', { path, action, status });
                ProcessErrors($scope, data, status, null, { hdr, msg });
            };
        }

        $scope.createInstanceGroup = () => {
            $state.go('instanceGroups.add');
        };
    }
];
