# week-calendar
## About
A HABpanel widget for displaying the items of 4 calendars of the current week. Inspired by @davorf s [calendar-five-events](https://github.com/davorf/calendar-five-events) widget.

## Installation

1. Install the widget [week-calendar.json](widget/week-calendar.json) using the HABPanel settings
2. copy the javascript [week-calendar.js](week-calendar.js) into the openhab-config html-folder **<openhab-config>/html/week-calendar/**
3. Create OpenHAB Groups and Items, see [items/week-calendar.items]([/items/week-calendar.items])
  - Group examples:
    - ```Group CurDate```
    - weekday groups
    ``` Group CurCalMon
    Group CurCalTue
    Group CurCalWed
    Group CurCalThu
    Group CurCalFri
    Group CurCalSat
    Group CurCalSun
    ```
    - one group for each calendar (max. 4)
  - Items for the 7 dates of the current week and one item for the number of the current week:

  ```
  Number          CurrentWeek             "aktuelle Woche [%]" (Time, CurDate)

  DateTime	CurCal_Mon_Date	"Datum  [%1$td.%1$tm.%1$tY]"	<calendar> (CurCalMon, CurDate)  ["Date"]
  DateTime	CurCal_Tue_Date	"Datum  [%1$td.%1$tm.%1$tY]"	<calendar> (CurCalTue, CurDate)  ["Date"]
  DateTime	CurCal_Wed_Date	"Datum  [%1$td.%1$tm.%1$tY]"	<calendar> (CurCalWed, CurDate)  ["Date"]
  DateTime	CurCal_Thu_Date	"Datum  [%1$td.%1$tm.%1$tY]"	<calendar> (CurCalThu, CurDate)  ["Date"]
  DateTime	CurCal_Fri_Date	"Datum  [%1$td.%1$tm.%1$tY]"	<calendar> (CurCalFri, CurDate)  ["Date"]
  DateTime	CurCal_Sat_Date	"Datum  [%1$td.%1$tm.%1$tY]"	<calendar> (CurCalSat, CurDate)  ["Date"]
  DateTime	CurCal_Sun_Date	"Datum  [%1$td.%1$tm.%1$tY]"	<calendar> (CurCalSun, CurDate)  ["Date"]
  ```

  - Items with FeatureTags, used tags are ```Summary, Location, StartTime, EndTime```, for each calendar and for each weekday 4 items are needed:

  ```
    String          FamilyCal_Mon_Sum         "Termin [%s]"                   <calendar>      (FamilyCal, CurCalMon) ["Summary"]
    String          FamilyCal_Mon_Loc         "Ort [%s]"                      <movecontrol>   (FamilyCal, CurCalMon) ["Location"]
    DateTime        FamilyCal_Mon_Start       "Datum  [%1$tH.%1$tM.%1$ts]"    <calendar>      (FamilyCal, CurCalMon) ["StartTime"]
    DateTime        FamilyCal_Mon_End         "Datum  [%1$tH.%1$tM.%1$ts]"    <calendar>      (FamilyCal, CurCalMon) ["EndTime"]  
   ```
  
 4.  Configure the widget in HABPanel using the created groups and items. 
