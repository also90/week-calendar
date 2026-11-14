(function () {
  'use strict';
  angular
    .module('app.widgets.week-calendar', [])
    .controller('WeekCalendarCtrl', ['$scope', 'OHService', function ($scope, OHService) {
      var vm = this;
      vm.data = null;
      vm.week = null;
      vm.offset = 0; // 0 = aktuelle Woche, -1 = vorige, +1 = nächste …
      vm.error = null;

      function pad(n) { return n < 10 ? '0' + n : '' + n; }
      function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
      }

      function select() {
        if (!vm.data || !vm.data.weeks) { vm.week = null; return; }
        var idx = vm.data.current + vm.offset;
        idx = Math.max(0, Math.min(vm.data.weeks.length - 1, idx));
        vm.offset = idx - vm.data.current;
        vm.week = vm.data.weeks[idx];
      }

      // Markup mit Cache-Buster laden (openHAB liefert /static mit max-age von 1 Jahr aus)
      vm.tpl = '/static/week-calendar/week-calendar.html?v=' + Date.now();

      function load() {
        var itemName = $scope.config.item || 'WeekCalendar_Json';
        var item = OHService.getItem(itemName);
        if (!item || !item.state || item.state === 'NULL' || item.state === 'UNDEF') {
          vm.error = 'Noch keine Daten in ' + itemName;
          return;
        }
        try {
          var data = JSON.parse(item.state);
          if (!data.weeks) throw new Error('altes Format');
          vm.data = data;
          vm.today = todayStr();
          vm.error = null;
          select(); // gewählte Woche (relativ zu heute) beibehalten
        } catch (e) {
          vm.error = 'Ungültiges JSON in ' + itemName;
        }
      }

      vm.isToday = function (day) { return day.date === vm.today; };
      vm.canPrev = function () { return vm.data && vm.data.current + vm.offset > 0; };
      vm.canNext = function () { return vm.data && vm.data.current + vm.offset < vm.data.weeks.length - 1; };
      vm.prev = function () { if (vm.canPrev()) { vm.offset--; select(); } };
      vm.next = function () { if (vm.canNext()) { vm.offset++; select(); } };
      vm.home = function () { vm.offset = 0; select(); };

      OHService.onUpdate($scope, $scope.config.item || 'WeekCalendar_Json', load);
      load();
    }]);
})();
