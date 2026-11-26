import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (
    typeof userId !== 'string'
    || typeof teamId !== 'string'
    || typeof type !== 'string'
    || typeof minutes !== 'number'
    || !mongoose.isValidObjectId(userId)
    || !mongoose.isValidObjectId(teamId)
    || !type.trim()
    || !Number.isFinite(minutes)
    || minutes < 1
  ) {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId),
    Team.findById(teamId),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('User or team not found'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Invalid team input'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };
  if (
    typeof name !== 'string'
    || !name.trim()
    || typeof mascot !== 'string'
    || !mascot.trim()
    || !Array.isArray(members)
    || !members.every((member): member is string => typeof member === 'string' && mongoose.isValidObjectId(member))
  ) {
    throw Object.assign(new Error('Invalid team input'), { status: 400 });
  }

  if (members.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: members } });
    if (existingMembers !== new Set(members).size) {
      throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
    }
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members,
  });
}

export async function getLeaderboard() {
  const teams = await Activity.aggregate<{
    teamName: string;
    totalPoints: number;
  }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $sort: { totalPoints: -1, 'team.name': 1 } },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

function focusForActivity(type: string) {
  const normalizedType = type.trim().toLowerCase();
  if (['run', 'running', 'cycle', 'cycling', 'walk', 'walking', 'swim', 'swimming'].includes(normalizedType)) {
    return 'endurance';
  }
  if (['strength', 'weightlifting', 'weights'].includes(normalizedType)) {
    return 'strength';
  }
  if (['yoga', 'stretch', 'stretching'].includes(normalizedType)) {
    return 'mobility';
  }
  return normalizedType;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() });
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).select('type').lean(),
    Workout.find().lean(),
  ]);
  const activityTypes = [...new Set(activities.map(({ type }) => type))];
  const activityFocuses = new Map<string, number>();
  for (const { type } of activities) {
    const focus = focusForActivity(type);
    activityFocuses.set(focus, (activityFocuses.get(focus) ?? 0) + 1);
  }

  const goal = user.fitnessGoal.trim().toLowerCase();
  const recentFocuses = [...activityFocuses.entries()]
    .sort((first, second) => second[1] - first[1])
    .map(([focus]) => focus);
  const matchingGoal = workouts.some(({ focus }) => focus.trim().toLowerCase() === goal);
  const preferredFocus = matchingGoal
    ? goal
    : recentFocuses.find((focus) => workouts.some((workout) => workout.focus.trim().toLowerCase() === focus));

  if (!preferredFocus) return [];

  const reason = preferredFocus === goal
    ? `Matches your ${goal} goal${activityTypes.length ? ` and recent ${activityTypes.join(', ')} activity` : ''}.`
    : `Matches your recent ${activityTypes.join(', ')} activity pattern.`;

  return workouts
    .filter(({ focus }) => focus.trim().toLowerCase() === preferredFocus)
    .map((workout) => ({ ...workout, reason }));
}

export { User };
