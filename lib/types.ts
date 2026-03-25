// Type definitions for the DJI Waypoint Planner application

/** Camera action that can be triggered at a waypoint */
export type CameraAction = 'none' | 'photo' | 'startVideo' | 'stopVideo';

/** Mission types supported by the application */
export type MissionType = 'waypoints' | 'spiral' | 'grid' | 'orbit';

/** A single waypoint in a mission */
export interface Waypoint {
  /** Unique identifier for this waypoint */
  id: string;
  /** Latitude coordinate (WGS84) */
  lat: number;
  /** Longitude coordinate (WGS84) */
  lng: number;
  /** Flight altitude above start point in meters */
  height: number;
  /** Flight speed at this waypoint in m/s */
  speed: number;
  /** Time to hover at this waypoint in seconds */
  waitTime: number;
  /** Camera action to perform at this waypoint */
  cameraAction: CameraAction;
}

/** A saved mission */
export interface Mission {
  /** Unique identifier for this mission */
  id: string;
  /** User-defined name for this mission */
  name: string;
  /** Type of the mission */
  type: MissionType;
  /** ISO date string of when the mission was created */
  createdAt: string;
  /** List of waypoints in this mission */
  waypoints: Waypoint[];
}
