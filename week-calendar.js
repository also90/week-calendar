(function () {
	'use strict';
	angular
		.module('app.widgets.week-calendar', [])
		.controller('ngWeekCalCtrl', ['$rootScope', '$scope', 'OHService',
			function ($rootScope, $scope, OHService) {
				var wcc = this;
				wcc.cw=-1;
				wcc.currentDates = [];
				wcc.items = new Array(2);
				wcc.items[0] = [];
				wcc.items[1] = [];
				wcc.items[2] = [];
				wcc.items[3] = [];
				wcc.items[4] = [];
				wcc.items[5] = [];
				wcc.items[6] = [];
				wcc.items[7] = [];
				
				// Add leading zero to numbers below 10
				wcc.zeroPad = function (n) { 
					return (n < 10) ? ("0" + n) : n;
				}
				// -------------------
				//clear all stored Items
				wcc.clearAll = function(){
					wcc.items = new Array(2);
					for(var i=0;i<8; i++){
						wcc.items[i] = [];
						for(var j=0;j<4; j++){
							wcc.items[i].push({startTime: null , endTime:null, summary: '' , location: '' });
						}	
					}
					//console.log("------ ITEMS ARRRAY  - - EMPTY ----------" + JSON.stringify(wcc.items[1][2])) ;
				}
				wcc.calcTime = function(item){
					//console.log("(CALCTIME) startdate: " + item.startTime.withoutTime().getTime() + " enddate: " + item.endTime.withoutTime().getTime() + " startime: " + item.startTime.getTime() );
					if(item.startTime ==null || item.startTime.getTime()<300000){
						return "-";
					}
					if(item.endTime.withoutTime().getTime() == item.startTime.withoutTime().getTime()) {
						return (item.startTime.getHours() + ":" + wcc.zeroPad(item.startTime.getMinutes()) + " - " + item.endTime.getHours() + ":" + wcc.zeroPad(item.endTime.getMinutes()));
					}
					if(item.startTime.withoutTime() < item.endTime.withoutTime()) {
						return "All day";
					}
					return "-";
				}
				wcc.setDate = function(date, dayOfWeek){
					//console.log("setting date for day of week: " + dayOfWeek + " : " + date); 
					wcc.currentDates[dayOfWeek] = new Date();
					wcc.currentDates[dayOfWeek].setTime(Date.parse(date));
				}
				
				OHService.onUpdate($scope, 'CurrentWeek', function () {
						var item = OHService.getItem('CurrentWeek');
						if (item && wcc.cw != item.state) {
							console.log("CW:"+wcc.cw + " , new CW:"+item.state);
							wcc.cw = item.state;
						}
				});
				
				wcc.fillWcc = function(item, dayOfWeek, calIdx){
					//console.log(">>>> fill for " + item.name + " [" + dayOfWeek + "][" + calIdx + "] : " + item.state);
					var currentItem = wcc.items[dayOfWeek][calIdx];
					if(currentItem == undefined){
						currentItem = new Object();
					}
					if(item.tags.includes('Summary')) {  
						currentItem.summary = item.state;
					}
					if(item.tags.includes('Location')) {	
						currentItem.location = item.state; 
					}
					if(item.tags.includes('StartTime')) { 
						currentItem.startTime = new Date();
						currentItem.startTime.setTime(Date.parse(item.state));
						if(currentItem.endTime != undefined){
							currentItem.time = wcc.calcTime(currentItem);
						}
					}
					if(item.tags.includes('EndTime')) {
						currentItem.endTime = new Date();
						currentItem.endTime.setTime(Date.parse(item.state));
						if(currentItem.startTime != undefined){
							currentItem.time = wcc.calcTime(currentItem);
						}
					}
					//console.log("currentItem [" + dayOfWeek + "]["+ calIdx + "] " + JSON.stringify(currentItem));
					wcc.items[dayOfWeek][calIdx] = currentItem;
				}
				
				wcc.updateAll = function(){
					setTimeout(function(){
						var items = OHService.getItems();
						for (let item of items) {
							//MONDAY
							if (item.groupNames.includes($scope.config['CalendarGroupMon'])) {
								//console.log("MONDAY >>>> found Item " + item.name);
								if(item.groupNames.includes($scope.config['CurDateGroup'])){
									wcc.setDate(item.state, 1);
								}
								if(item.groupNames.includes($scope.config['Calendar1Group'])) {
									wcc.fillWcc(item, 1, 1);
								}
								if(item.groupNames.includes($scope.config['Calendar2Group'])) {
									wcc.fillWcc(item, 1, 2);
								}
								if(item.groupNames.includes($scope.config['Calendar3Group'])) {
									wcc.fillWcc(item, 1, 3);
								}
								if(item.groupNames.includes($scope.config['Calendar4Group'])) {
									wcc.fillWcc(item, 1, 4);
								}
							}
							//TUESDAY
							if (item.groupNames.includes($scope.config['CalendarGroupTue'])) {
								if(item.groupNames.includes($scope.config['CurDateGroup'])){
									wcc.setDate(item.state, 2);
								}
								if(item.groupNames.includes($scope.config['Calendar1Group'])) {
									wcc.fillWcc(item, 2, 1);
								}	 
								if(item.groupNames.includes($scope.config['Calendar2Group'])) {
									wcc.fillWcc(item, 2, 2);
								}
								if(item.groupNames.includes($scope.config['Calendar3Group'])) {
									wcc.fillWcc(item, 2, 3);
								}
								if(item.groupNames.includes($scope.config['Calendar4Group'])) {
									wcc.fillWcc(item, 2, 4);
								}
							}
							//WEDNESDAY
							if (item.groupNames.includes($scope.config['CalendarGroupWed'])) {
								if(item.groupNames.includes($scope.config['CurDateGroup'])){
									wcc.setDate(item.state, 3);
								}
								if(item.groupNames.includes($scope.config['Calendar1Group'])) {
									wcc.fillWcc(item, 3, 1);
								}	 
								if(item.groupNames.includes($scope.config['Calendar2Group'])) {
									wcc.fillWcc(item, 3, 2);
								}
								if(item.groupNames.includes($scope.config['Calendar3Group'])) {
									wcc.fillWcc(item, 3, 3);
								}
								if(item.groupNames.includes($scope.config['Calendar4Group'])) {
									wcc.fillWcc(item, 3, 4);
								}
							}
							//THURSDAY
							if (item.groupNames.includes($scope.config['CalendarGroupThu'])) {
								if(item.groupNames.includes($scope.config['CurDateGroup'])){
									wcc.setDate(item.state, 4);
								}
								if(item.groupNames.includes($scope.config['Calendar1Group'])) {
									wcc.fillWcc(item, 4, 1);
								}	 
								if(item.groupNames.includes($scope.config['Calendar2Group'])) {
									wcc.fillWcc(item, 4, 2);
								}
								if(item.groupNames.includes($scope.config['Calendar3Group'])) {
									wcc.fillWcc(item, 4, 3);
								}
								if(item.groupNames.includes($scope.config['Calendar4Group'])) {
									wcc.fillWcc(item, 4, 4);
								}
							}
							//FRIDAY
							if (item.groupNames.includes($scope.config['CalendarGroupFri'])) {
								if(item.groupNames.includes($scope.config['CurDateGroup'])){
									wcc.setDate(item.state, 5);
								}
								if(item.groupNames.includes($scope.config['Calendar1Group'])) {
									wcc.fillWcc(item, 5, 1);
								}	 
								if(item.groupNames.includes($scope.config['Calendar2Group'])) {
									wcc.fillWcc(item, 5, 2);
								}
								if(item.groupNames.includes($scope.config['Calendar3Group'])) {
									wcc.fillWcc(item, 5, 3);
								}
								if(item.groupNames.includes($scope.config['Calendar4Group'])) {
									wcc.fillWcc(item, 5, 4);
								}
							}
							//SATURDAY
							if (item.groupNames.includes($scope.config['CalendarGroupSat'])) {
								if(item.groupNames.includes($scope.config['CurDateGroup'])){
									wcc.setDate(item.state, 6);
								}
								if(item.groupNames.includes($scope.config['Calendar1Group'])) {
									wcc.fillWcc(item, 6, 1);
								}	 
								if(item.groupNames.includes($scope.config['Calendar2Group'])) {
									wcc.fillWcc(item, 6, 2);
								}
								if(item.groupNames.includes($scope.config['Calendar3Group'])) {
									wcc.fillWcc(item, 6, 3);
								}
								if(item.groupNames.includes($scope.config['Calendar4Group'])) {
									wcc.fillWcc(item, 6, 4);
								}
							}
							//SUNDAY
							if (item.groupNames.includes($scope.config['CalendarGroupSun'])) {
								if(item.groupNames.includes($scope.config['CurDateGroup'])){
									wcc.setDate(item.state, 7);
								}
								if(item.groupNames.includes($scope.config['Calendar1Group'])) {
									wcc.fillWcc(item, 7, 1);
								}	 
								if(item.groupNames.includes($scope.config['Calendar2Group'])) {
									wcc.fillWcc(item, 7, 2);
								}
								if(item.groupNames.includes($scope.config['Calendar3Group'])) {
									wcc.fillWcc(item, 7, 3);
								}
								if(item.groupNames.includes($scope.config['Calendar4Group'])) {
									wcc.fillWcc(item, 7, 4);
								}
							}
									
						}
					}, $scope.config['WaitForUpdate']);	
				}
				
				OHService.onUpdate($scope, $scope.config['CurrentWeek'], function() {
						//console.log("TRIGGER for currentweek");
						var cwItem = OHService.getItem($scope.config['CurrentWeek']);
						if(wcc.currentWeek != cwItem.state){
							console.log("triggerUpdate for CURRENTWEEK(" + $scope.config['CurrentWeek'] + "), got " + cwItem.state + " for CurrentWeek, waiting " + $scope.config['WaitForUpdate'] + "ms"  );
							wcc.clearAll();
							wcc.updateAll();												
						}
						wcc.currentWeek=cwItem.state;
				});
				
				
				
				
			}
			
		]);
})();