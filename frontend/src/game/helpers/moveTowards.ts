import { GameObject } from "../GameObject";
import { Vector2 } from "../Vector2";

export const moveTowards = (
  person: GameObject,
  destinationPosition: Vector2,
  speed: number,
) => {
  const distanceToTravelX = destinationPosition.x - person.position.x;
  const distanceToTravelY = destinationPosition.y - person.position.y;

  let distance = Math.sqrt(distanceToTravelX ** 2 + distanceToTravelY ** 2);

  if (distance <= speed) {
    person.position.x = destinationPosition.x;
    person.position.y = destinationPosition.y;
  } else {
    const normalizedX = distanceToTravelX / distance;
    const normalizedY = distanceToTravelY / distance;

    person.position.x += normalizedX * speed;
    person.position.y += normalizedY * speed;

    distance = Math.sqrt(distanceToTravelX ** 2 + distanceToTravelY ** 2);
  }
  return distance;
};
