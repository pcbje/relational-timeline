# relational timeline

A timeline designed to help present a sequence of events occurring over time involving several different entities.

Demo: http://codepen.io/pcbje/pen/ZBJrpP

### Usage:

```javascript
timeline.create('timeline') // ID of HTML element.
   .config({min_date: '2015-01-01', max_date: '2016-12-31', ...})
   .event_types(['Chat']) // ['']
   .nodes([{'id': 'Petter', 'type': 'Person'}, {'id': 'Karl', 'type': 'Person'}])
   .events([{type: 'Chat', timestamp: '2016-01-03', source: 'Petter', target: 'Karl', label: 'Label label'}])
   .ticks();
```
