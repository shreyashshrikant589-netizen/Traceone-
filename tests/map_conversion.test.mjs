import test from 'node:test';
import assert from 'node:assert/strict';

// 1. Coordinate Conversion & Validation
function coordinate([longitude, latitude]) {
  return { latitude, longitude };
}

function isValidCoordinate(coordinate) {
  if (!coordinate || typeof coordinate !== 'object') return false;
  return (
    Number.isFinite(coordinate.latitude) &&
    Number.isFinite(coordinate.longitude) &&
    coordinate.latitude >= -90 &&
    coordinate.latitude <= 90 &&
    coordinate.longitude >= -180 &&
    coordinate.longitude <= 180
  );
}

// 2. Zone Geometry Conversion
function geometry(value) {
  if (!value || typeof value !== 'object') return null;
  if (value.type === 'Point' && Array.isArray(value.coordinates) && value.coordinates.length >= 2) {
    return { type: 'Point', coordinates: coordinate(value.coordinates) };
  }
  if (value.type === 'Polygon' && Array.isArray(value.coordinates)) {
    return { type: 'Polygon', coordinates: value.coordinates.map((ring) => ring.map(coordinate)) };
  }
  if (value.type === 'MultiPolygon' && Array.isArray(value.coordinates)) {
    return { type: 'MultiPolygon', coordinates: value.coordinates.map((poly) => poly.map((ring) => ring.map(coordinate))) };
  }
  return null;
}

function isValidZone(zone) {
  if (!zone.id || !zone.caseId || !zone.name || !zone.geometry) return false;
  if (typeof zone.createdAt !== 'number' || !Number.isFinite(zone.createdAt)) return false;
  if (typeof zone.updatedAt !== 'number' || !Number.isFinite(zone.updatedAt)) return false;
  if (typeof zone.priorityScore !== 'number' || !Number.isFinite(zone.priorityScore)) return false;

  if (zone.geometry.type === 'Point') {
    return isValidCoordinate(zone.geometry.coordinates);
  }
  if (zone.geometry.type === 'Polygon') {
    return zone.geometry.coordinates.every((ring) => ring.length >= 3 && ring.every(isValidCoordinate));
  }
  if (zone.geometry.type === 'MultiPolygon') {
    return zone.geometry.coordinates.every((poly) =>
      poly.every((ring) => ring.length >= 3 && ring.every(isValidCoordinate))
    );
  }
  return false;
}

function zonePriorityMetadata(priorityScore) {
  if (priorityScore >= 90) return { label: 'Critical', color: '#dc2626', scoreBand: 'critical' };
  if (priorityScore >= 70) return { label: 'High', color: '#f97316', scoreBand: 'high' };
  if (priorityScore >= 45) return { label: 'Medium', color: '#facc15', scoreBand: 'medium' };
  if (priorityScore >= 20) return { label: 'Low', color: '#3b82f6', scoreBand: 'low' };
  return { label: 'Minimal', color: '#94a3b8', scoreBand: 'minimal' };
}

// 3. Tests
test('Coordinate conversion: [lng, lat] correctly maps to { latitude, longitude } without inversion', () => {
  const backendGeoJsonPoint = [77.2090, 28.6139]; // [longitude, latitude]
  const converted = coordinate(backendGeoJsonPoint);
  assert.equal(converted.latitude, 28.6139);
  assert.equal(converted.longitude, 77.2090);
  assert.equal(isValidCoordinate(converted), true);
});

test('Coordinate validation: rejects invalid coordinates safely', () => {
  assert.equal(isValidCoordinate({ latitude: 91, longitude: 77 }), false); // out of bounds lat
  assert.equal(isValidCoordinate({ latitude: 28, longitude: 181 }), false); // out of bounds lon
  assert.equal(isValidCoordinate({ latitude: NaN, longitude: 77 }), false);
  assert.equal(isValidCoordinate({ latitude: 28, longitude: Infinity }), false);
  assert.equal(isValidCoordinate(null), false);
  assert.equal(isValidCoordinate(undefined), false);
});

test('Zone geometry conversion: GeoJSON Polygon to SearchZone geometry', () => {
  const geojsonPolygon = {
    type: 'Polygon',
    coordinates: [
      [
        [77.20, 28.61],
        [77.21, 28.61],
        [77.21, 28.62],
        [77.20, 28.62],
        [77.20, 28.61],
      ],
    ],
  };

  const convertedGeometry = geometry(geojsonPolygon);
  assert.ok(convertedGeometry);
  assert.equal(convertedGeometry.type, 'Polygon');
  assert.equal(convertedGeometry.coordinates[0].length, 5);
  assert.equal(convertedGeometry.coordinates[0][0].latitude, 28.61);
  assert.equal(convertedGeometry.coordinates[0][0].longitude, 77.20);

  const zone = {
    id: 'zone-1',
    caseId: 'case-1',
    name: 'Sector 4',
    geometry: convertedGeometry,
    status: 'ASSIGNED',
    priorityScore: 85,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  assert.equal(isValidZone(zone), true);
  const priority = zonePriorityMetadata(zone.priorityScore);
  assert.equal(priority.label, 'High');
  assert.equal(priority.color, '#f97316');
});

test('Zone validation: rejects incomplete rings or missing geometries without crashing', () => {
  const invalidPolygon = {
    type: 'Polygon',
    coordinates: [
      [[77.20, 28.61], [77.21, 28.61]], // only 2 points, not a valid polygon
    ],
  };
  const convertedGeometry = geometry(invalidPolygon);
  const zone = {
    id: 'zone-invalid',
    caseId: 'case-1',
    name: 'Invalid Zone',
    geometry: convertedGeometry,
    status: 'UNSEARCHED',
    priorityScore: 50,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  assert.equal(isValidZone(zone), false);
});

test('Data safety: map filtering eliminates invalid or missing data without fabricating points', () => {
  const rawZones = [
    {
      id: 'z1',
      caseId: 'c1',
      name: 'Valid Zone',
      priorityScore: 92,
      geometry: {
        type: 'Point',
        coordinates: { latitude: 28.61, longitude: 77.20 },
      },
      status: 'ASSIGNED',
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: 'z2',
      caseId: 'c1',
      name: 'Corrupt Zone',
      priorityScore: 30,
      geometry: null, // missing geometry
      status: 'UNSEARCHED',
      createdAt: 1000,
      updatedAt: 1000,
    },
  ];

  const renderable = rawZones.filter((z) => z.geometry !== null && isValidZone(z));
  assert.equal(renderable.length, 1);
  assert.equal(renderable[0].id, 'z1');
  assert.equal(zonePriorityMetadata(renderable[0].priorityScore).label, 'Critical');
});

test('Realtime channel subscription cleanup pattern', async () => {
  const cleanedChannels = [];
  const fakeClient = {
    channel: (key) => ({
      on: () => ({
        subscribe: (cb) => {
          cb('SUBSCRIBED');
          return {};
        },
      }),
    }),
    removeChannel: async (chan) => {
      cleanedChannels.push(chan);
    },
  };

  const channelMap = new Map();
  const channelKey = 'locations:case-123';
  const chanObj = fakeClient.channel(channelKey);
  channelMap.set(channelKey, chanObj);

  // Unsubscribe
  assert.equal(channelMap.has(channelKey), true);
  await fakeClient.removeChannel(channelMap.get(channelKey));
  channelMap.delete(channelKey);

  assert.equal(channelMap.has(channelKey), false);
  assert.equal(cleanedChannels.length, 1);
});
