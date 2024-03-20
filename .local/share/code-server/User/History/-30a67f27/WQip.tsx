import L from 'leaflet';

// export const iconPerson = L.Icon.extend({
//   options: {
//     iconUrl: '/pin.svg',
//     iconRetinaUrl: '/pin.svg',
//     iconAnchor: null,
//     popupAnchor: null,
//     shadowUrl: null,
//     shadowSize: null,
//     shadowAnchor: null,
//     iconSize: new L.Point(60, 75),
//     className: 'leaflet-div-icon',
//   },
// });

export const iconPerson = new L.Icon({
  iconUrl: '/pin.svg',
  iconRetinaUrl: '/pin.svg',
  iconAnchor: undefined,
  popupAnchor: undefined,
  shadowUrl: undefined,
  shadowSize: undefined,
  shadowAnchor: undefined,
  iconSize: new L.Point(60, 75),
  className: '',
});
