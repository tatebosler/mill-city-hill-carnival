'use client';

import { useState, useLayoutEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faXmark,
  faGripVertical,
  faWandMagicSparkles,
  faCircleCheck,
  faCircle,
  faTrash,
  faRotateLeft,
  faSortAmountDown,
  faRuler,
} from '@fortawesome/free-solid-svg-icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import {
  Hill,
  HillSize,
  HILL_SIZES,
  canAutoComplete,
  doComplete,
  makeId,
} from '../lib/workoutGenerator';

const HILL_COLORS: Record<HillSize, string> = {
  100: 'bg-fuchsia-300 dark:bg-fuchsia-700',
  200: 'bg-sky-300 dark:bg-sky-700',
  300: 'bg-emerald-300 dark:bg-emerald-700',
  400: 'bg-yellow-300 dark:bg-yellow-700',
};

// Unit conversions
const METERS_PER_MILE = 1609.344;
const METERS_PER_KM = 1000;

// MCR location data
const MCR_DISTANCE_KM = 3.55;
const MCR_DISTANCE_M = MCR_DISTANCE_KM * METERS_PER_KM;
const COFFMAN_STAIRS_DISTANCE = 140; // 70m up + 70m down

// Conversion functions
function metersToKm(m: number): number {
  return m / METERS_PER_KM;
}

function kmToMiles(km: number): number {
  return km * (METERS_PER_KM / METERS_PER_MILE);
}

const HILL_BUTTON_COLORS: Record<HillSize, string> = {
  100: 'border-fuchsia-300 dark:border-fuchsia-700 bg-fuchsia-200 dark:bg-fuchsia-800 text-fuchsia-900 dark:text-fuchsia-100 hover:bg-fuchsia-300 dark:hover:bg-fuchsia-700 active:bg-fuchsia-400 dark:active:bg-fuchsia-600',
  200: 'border-sky-300 dark:border-sky-700 bg-sky-200 dark:bg-sky-800 text-sky-900 dark:text-sky-100 hover:bg-sky-300 dark:hover:bg-sky-700 active:bg-sky-400 dark:active:bg-sky-600',
  300: 'border-emerald-300 dark:border-emerald-700 bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-300 dark:hover:bg-emerald-700 active:bg-emerald-400 dark:active:bg-emerald-600',
  400: 'border-yellow-300 dark:border-yellow-700 bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-300 dark:hover:bg-yellow-700 active:bg-yellow-400 dark:active:bg-yellow-600',
};

type SortType = 'longest' | 'shortest' | 'descending-ladder' | 'ascending-ladder' | 'grouped-random' | 'maximum-chaos';

function sortHills(hills: Hill[], type: SortType): Hill[] {
  const result = [...hills];

  switch (type) {
    case 'longest':
      result.sort((a, b) => b.size - a.size);
      break;
    case 'shortest':
      result.sort((a, b) => a.size - b.size);
      break;
    case 'descending-ladder': {
      const cycle: HillSize[] = [400, 300, 200, 100];
      const grouped: Record<HillSize, Hill[]> = { 100: [], 200: [], 300: [], 400: [] };
      for (const hill of result) {
        grouped[hill.size].push(hill);
      }
      result.length = 0;
      while (result.length < hills.length) {
        for (let i = 0; i < 4; i++) {
          const size = cycle[i];
          if (grouped[size].length > 0) {
            result.push(grouped[size].shift()!);
          }
        }
      }
      break;
    }
    case 'ascending-ladder': {
      const cycle: HillSize[] = [100, 200, 300, 400];
      const grouped: Record<HillSize, Hill[]> = { 100: [], 200: [], 300: [], 400: [] };
      for (const hill of result) {
        grouped[hill.size].push(hill);
      }
      result.length = 0;
      while (result.length < hills.length) {
        for (let i = 0; i < 4; i++) {
          const size = cycle[i];
          if (grouped[size].length > 0) {
            result.push(grouped[size].shift()!);
          }
        }
      }
      break;
    }
    case 'grouped-random': {
      const grouped: Record<HillSize, Hill[]> = { 100: [], 200: [], 300: [], 400: [] };
      for (const hill of result) {
        grouped[hill.size].push(hill);
      }
      // Shuffle the order of distances
      const distances: HillSize[] = [100, 200, 300, 400];
      for (let i = distances.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [distances[i], distances[j]] = [distances[j], distances[i]];
      }
      result.length = 0;
      for (const distance of distances) {
        result.push(...grouped[distance]);
      }
      break;
    }
    case 'maximum-chaos': {
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      break;
    }
  }

  return result;
}



function SortableHillItem({
  hill,
  index,
  onRemove,
}: {
  hill: Hill;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: hill.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`flex items-center gap-3 rounded-lg px-3 py-3 ${HILL_COLORS[hill.size]}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none shrink-0 text-gray-900/40 dark:text-white/50 hover:text-gray-900/70 dark:hover:text-white/80"
        aria-label={`Drag to reorder hill ${index + 1}`}
      >
        <FontAwesomeIcon icon={faGripVertical} className="size-4" aria-hidden />
      </button>

      <span className="grow text-center text-xl font-bold text-gray-900 dark:text-white">
        {hill.size}m
      </span>

      <span className="shrink-0 text-xs tabular-nums text-gray-900/40 dark:text-white/50">
        #{index + 1}
      </span>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove hill ${index + 1} (${hill.size}m)`}
        className="cursor-pointer shrink-0 text-gray-900/40 dark:text-white/50 hover:text-gray-900/80 dark:hover:text-white"
      >
        <FontAwesomeIcon icon={faXmark} className="size-4" aria-hidden />
      </button>
    </div>
  );
}

interface WorkoutBuilderProps {
  distance: number;
  reps: number;
  setDistance: (n: number) => void;
  setReps: (n: number) => void;
}

export default function WorkoutBuilder({ distance, reps, setDistance, setReps }: WorkoutBuilderProps) {
  const [hills, setHills] = useState<Hill[]>([]);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [distanceDialogOpen, setDistanceDialogOpen] = useState(false);
  const [includeWarmupCooldown, setIncludeWarmupCooldown] = useState(false);
  const [includeCoffmanStairs, setIncludeCoffmanStairs] = useState(false);
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const prevDistanceRepsRef = useRef<{ distance: number; reps: number }>({ distance, reps });

  // User preference for how to handle changes.
  // We remember a user's "keep" choice for the current session only.
  // Do NOT persist the "delete" choice because the user wants to be
  // prompted on each subsequent change when they choose delete.
  const [changePreference, setChangePreference] = useState<'delete' | 'keep' | null>(null);

  // Watch for distance/reps changes
  useLayoutEffect(() => {
    const prev = prevDistanceRepsRef.current;

    if ((distance !== prev.distance || reps !== prev.reps) && hills.length > 0) {
      // If the user explicitly chose to keep the workout for this session,
      // do not prompt and do not delete.
      if (changePreference === 'keep') {
        // do nothing, user wants to keep their workout for this session
      } else {
        // Prompt the user on each change (unless they chose keep).
        if (!changeDialogOpen) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setChangeDialogOpen(true);
        }
      }
    }
    prevDistanceRepsRef.current = { distance, reps };
  }, [distance, reps, changePreference, hills.length, changeDialogOpen]);

  function undoChange() {
    const prev = prevDistanceRepsRef.current;
    // Revert parent-controlled distance/reps to previous values
    setDistance(prev.distance);
    setReps(prev.reps);
    setChangeDialogOpen(false);
  }

  const totalDist = hills.reduce((s, h) => s + h.size, 0);
  const allFourPresent = HILL_SIZES.every((s) => hills.some((h) => h.size === s));
  const isComplete = hills.length === reps && totalDist === distance && allFourPresent;
  const completable = !isComplete && canAutoComplete(hills, distance, reps);
  const distOver = totalDist > distance;
  const repsOver = hills.length > reps;
  const missingDistances = HILL_SIZES.filter((s) => !hills.some((h) => h.size === s));

  // Distance calculations
  const hillsDistanceM = totalDist;
  const recoveryDistanceM = hillsDistanceM; // Jog back down
  const warmupDistanceM = includeWarmupCooldown ? MCR_DISTANCE_M : 0;
  const cooldownDistanceM = includeWarmupCooldown ? MCR_DISTANCE_M : 0;
  const coffmanDistanceM = includeCoffmanStairs ? COFFMAN_STAIRS_DISTANCE : 0;
  const totalDistanceM = hillsDistanceM + recoveryDistanceM + coffmanDistanceM + warmupDistanceM + cooldownDistanceM;
  const totalDistanceKm = metersToKm(totalDistanceM);
  const totalDistanceMiles = kmToMiles(totalDistanceKm);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setHills((prev) => {
        const oldIdx = prev.findIndex((h) => h.id === active.id);
        const newIdx = prev.findIndex((h) => h.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }

  function canAdd(size: HillSize) {
    // Basic constraints: room for rep and distance
    if (hills.length >= reps || totalDist + size > distance) {
      return false;
    }

    // Check if adding this hill would leave an impossible state
    // by testing if we could still auto-complete
    const afterAdding = [...hills, { id: '_test', size }];
    return canAutoComplete(afterAdding, distance, reps);
  }

  function addHill(size: HillSize) {
    setHills((prev) => [...prev, { id: makeId(), size }]);
  }

  function removeHill(id: string) {
    setHills((prev) => prev.filter((h) => h.id !== id));
  }

  function handleComplete(distribution: 'consistency' | 'variety') {
    setHills(doComplete(hills, distance, reps, distribution));
    setCompleteDialogOpen(false);
    setSortDialogOpen(true);
  }

  function closeCompleteDialog() {
    setCompleteDialogOpen(false);
  }

  function handleReset() {
    setHills([]);
    // Reset the stored session preference so the user is prompted again
    // on subsequent distance/reps changes.
    setChangePreference(null);
  }

  function handleSort(type: SortType) {
    setHills(sortHills(hills, type));
    setSortDialogOpen(false);
  }

  function handleChangePreference(preference: 'delete' | 'keep') {
    if (preference === 'keep') {
      // Remember "keep" for the rest of this session
      setChangePreference('keep');
    } else {
      // If they choose delete, clear the workout but do not persist the
      // preference so we will prompt again on the next change.
      setHills([]);
      // Ensure we do not record "delete" as a lasting preference
      setChangePreference(null);
    }
    setChangeDialogOpen(false);
  }

  return (
    <div className="mt-8 sm:mt-12 mx-4 sm:mx-24">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Build Your Workout</h2>
        <span
          role="status"
          aria-live="polite"
          className={`text-sm tabular-nums ${
            isComplete
              ? 'text-green-600 dark:text-green-400'
              : distOver || repsOver
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {hills.length} / {reps} hills · {totalDist.toLocaleString()} / {distance.toLocaleString()}m
        </span>
      </div>

      {/* Add-hill buttons + Complete Workout */}
      <div className="flex flex-wrap gap-2 mb-4">
        {HILL_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => addHill(size)}
            disabled={!canAdd(size)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium cursor-pointer ${
              canAdd(size)
                ? HILL_BUTTON_COLORS[size]
                : 'border-gray-400 dark:border-gray-600 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <FontAwesomeIcon icon={faPlus} className="size-3" aria-hidden />
            {size}m
          </button>
        ))}

        {completable && (
          <button
            type="button"
            onClick={() => setCompleteDialogOpen(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600"
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} className="size-3" aria-hidden />
            Complete Workout
          </button>
        )}

        {hills.length > 0 && (
          <>
            <button
              type="button"
              onClick={handleReset}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10"
            >
              <FontAwesomeIcon icon={faRotateLeft} className="size-3" aria-hidden />
              Reset
            </button>

            <button
              type="button"
              onClick={() => setSortDialogOpen(true)}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10"
            >
              <FontAwesomeIcon icon={faSortAmountDown} className="size-3" aria-hidden />
              Sort All
            </button>

            <button
              type="button"
              onClick={() => setDistanceDialogOpen(true)}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10"
            >
              <FontAwesomeIcon icon={faRuler} className="size-3" aria-hidden />
              Show Total Distance
            </button>
          </>
        )}
      </div>

      {/* Hill list */}
      {hills.length > 0 ? (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={hills.map((h) => h.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {hills.map((hill, i) => (
                  <SortableHillItem
                    key={hill.id}
                    hill={hill}
                    index={i}
                    onRemove={() => removeHill(hill.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Status message */}
          <div role="status" aria-live="polite" className="mt-3 text-sm">
            {isComplete ? (
              <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <FontAwesomeIcon icon={faCircleCheck} className="size-4" aria-hidden />
                Workout complete!
              </span>
            ) : distOver ? (
              <span className="text-red-600 dark:text-red-400">
                Distance exceeds target by {(totalDist - distance).toLocaleString()}m — remove some hills.
              </span>
            ) : repsOver ? (
              <span className="text-red-600 dark:text-red-400">
                Too many hills ({hills.length} of {reps}) — remove some hills.
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                {reps - hills.length > 0 &&
                  `${reps - hills.length} more hill${reps - hills.length !== 1 ? 's' : ''} needed. `}
                {distance - totalDist > 0 && `${(distance - totalDist).toLocaleString()}m remaining. `}
                {missingDistances.length > 0 &&
                  `Must include: ${missingDistances.map((s) => `${s}m`).join(', ')}.`}
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          Add hills using the buttons above
          {completable && (
            <>
              , or click <strong className="text-gray-600 dark:text-gray-300">Complete Workout</strong> to fill
              in automatically
            </>
          )}
          .
        </p>
      )}

      <Dialog open={completeDialogOpen} onClose={closeCompleteDialog} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/60" />
        <div className="fixed inset-x-0 top-0 flex justify-center pt-2">
          <DialogPanel className="bg-gray-700 rounded-lg p-6 mx-4 w-full max-w-sm shadow-xl text-left">
            <DialogTitle className="text-lg font-medium text-white mb-3">
              Consistency or variety?
            </DialogTitle>
            <p className="text-sm text-gray-300 mb-4">
              How would you like the remaining hills distributed?
            </p>
            <div className="flex flex-col gap-2 mb-4">
              <button
                type="button"
                onClick={() => handleComplete('consistency')}
                className="cursor-pointer w-full text-left rounded-md bg-gray-600 px-4 py-2 hover:bg-gray-500 focus:outline-2 focus:outline-indigo-500"
              >
                <div className="font-medium text-white">Consistency</div>
                <div className="text-sm text-gray-300">Repeat one distance as much as possible</div>
              </button>
              <button
                type="button"
                onClick={() => handleComplete('variety')}
                className="cursor-pointer w-full text-left rounded-md bg-gray-600 px-4 py-2 hover:bg-gray-500 focus:outline-2 focus:outline-indigo-500"
              >
                <div className="font-medium text-white">Variety</div>
                <div className="text-sm text-gray-300">Spread reps across all four distances</div>
              </button>
            </div>
            <button
              type="button"
              onClick={closeCompleteDialog}
              className="cursor-pointer rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-500 hover:text-white flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faXmark} className="size-4" />
              Cancel
            </button>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog open={sortDialogOpen} onClose={() => setSortDialogOpen(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/60" />
        <div className="fixed inset-x-0 top-0 flex justify-center pt-2">
          <DialogPanel className="bg-gray-700 rounded-lg p-6 mx-4 w-full max-w-sm shadow-xl text-left">
            <DialogTitle className="text-lg font-medium text-white mb-4">
              Sort your hills
            </DialogTitle>
            <div className="flex flex-col gap-2 mb-4">
              <button
                type="button"
                onClick={() => handleSort('longest')}
                className="cursor-pointer w-full text-left rounded-md bg-gray-600 px-4 py-2 hover:bg-gray-500 focus:outline-2 focus:outline-indigo-500"
              >
                <div className="font-medium text-white">Longest hills first</div>
                <div className="text-sm text-gray-300">all 400s, then all 300s, etc</div>
              </button>
              <button
                type="button"
                onClick={() => handleSort('shortest')}
                className="cursor-pointer w-full text-left rounded-md bg-gray-600 px-4 py-2 hover:bg-gray-500 focus:outline-2 focus:outline-indigo-500"
              >
                <div className="font-medium text-white">Shortest hills first</div>
                <div className="text-sm text-gray-300">all 100s, then all 200s, etc</div>
              </button>
              <button
                type="button"
                onClick={() => handleSort('descending-ladder')}
                className="cursor-pointer w-full text-left rounded-md bg-gray-600 px-4 py-2 hover:bg-gray-500 focus:outline-2 focus:outline-indigo-500"
              >
                <div className="font-medium text-white">Descending ladders</div>
                <div className="text-sm text-gray-300">400, 300, 200, 100, 400, 300...</div>
              </button>
              <button
                type="button"
                onClick={() => handleSort('ascending-ladder')}
                className="cursor-pointer w-full text-left rounded-md bg-gray-600 px-4 py-2 hover:bg-gray-500 focus:outline-2 focus:outline-indigo-500"
              >
                <div className="font-medium text-white">Ascending ladders</div>
                <div className="text-sm text-gray-300">100, 200, 300, 400, 100, 200...</div>
              </button>
              <button
                type="button"
                onClick={() => handleSort('grouped-random')}
                className="cursor-pointer w-full text-left rounded-md bg-gray-600 px-4 py-2 hover:bg-gray-500 focus:outline-2 focus:outline-indigo-500"
              >
                <div className="font-medium text-white">Grouped Random</div>
                <div className="text-sm text-gray-300">Do all repeats of the same distance together, but shuffle the distances</div>
              </button>
              <button
                type="button"
                onClick={() => handleSort('maximum-chaos')}
                className="cursor-pointer w-full text-left rounded-md bg-gray-600 px-4 py-2 hover:bg-gray-500 focus:outline-2 focus:outline-indigo-500"
              >
                <div className="font-medium text-white font-serif">Maximum Chaos</div>
                <div className="text-sm text-gray-300">Randomly shuffle everything</div>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSortDialogOpen(false)}
              className="cursor-pointer rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-500 hover:text-white flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faXmark} className="size-4" />
              Cancel
            </button>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog open={distanceDialogOpen} onClose={() => setDistanceDialogOpen(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/60" />
        <div className="fixed inset-x-0 top-0 flex justify-center pt-2">
          <DialogPanel className="bg-gray-700 rounded-lg p-6 mx-4 w-full max-w-sm shadow-xl text-left max-h-[90vh] overflow-y-auto">
            <DialogTitle className="text-lg font-medium text-white mb-4">
              Total Distance
            </DialogTitle>

            <div className="space-y-3 mb-4">
              {/* Workout breakdown */}
              <div className="bg-gray-600 rounded-lg p-3 space-y-1 text-xs">
                <h3 className="font-semibold text-white mb-1">Workout Breakdown</h3>
                <div className="flex justify-between text-gray-300">
                  <span>Hills (up)</span>
                  <span>{kmToMiles(hillsDistanceM / 1000).toFixed(2)} mi ({(hillsDistanceM / 1000).toFixed(2)} km)</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Recovery (down)</span>
                  <span>{kmToMiles(recoveryDistanceM / 1000).toFixed(2)} mi ({(recoveryDistanceM / 1000).toFixed(2)} km)</span>
                </div>
                {includeCoffmanStairs && (
                  <div className="flex justify-between text-gray-300">
                    <span>Coffman Stairs</span>
                    <span>0.09 mi (0.14 km)</span>
                  </div>
                )}
              </div>

            {/* Warmup/Cooldown toggle */}
              <button
                type="button"
                onClick={() => setIncludeWarmupCooldown(!includeWarmupCooldown)}
                className={`w-full flex items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                  includeWarmupCooldown
                    ? 'bg-indigo-600 hover:bg-indigo-500'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                <div className="shrink-0">
                  {includeWarmupCooldown && (
                    <FontAwesomeIcon icon={faCircleCheck} className="size-5 text-white" aria-hidden />
                  )}
                  {!includeWarmupCooldown && (
                    <FontAwesomeIcon icon={faCircle} className="size-5 text-gray-400" aria-hidden />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">Include warmup and cooldown from/to MCR-NE</div>
                  <div className="text-sm text-gray-200 mt-0.5">+ {(MCR_DISTANCE_KM * 0.621371).toFixed(2)} miles ({MCR_DISTANCE_KM.toFixed(2)} km) each way</div>
                </div>
              </button>

              {/* Cooldown note is included above */}

              {/* Coffman Stairs toggle */}
              <button
                type="button"
                onClick={() => setIncludeCoffmanStairs(!includeCoffmanStairs)}
                className={`w-full flex items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                  includeCoffmanStairs
                    ? 'bg-indigo-600 hover:bg-indigo-500'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                <div className="shrink-0">
                  {includeCoffmanStairs && (
                    <FontAwesomeIcon icon={faCircleCheck} className="size-5 text-white" aria-hidden />
                  )}
                  {!includeCoffmanStairs && (
                    <FontAwesomeIcon icon={faCircle} className="size-5 text-gray-400" aria-hidden />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">Include Coffman Stairs Finisher</div>
                  <div className="text-sm text-gray-200 mt-0.5">+ 230&apos; (70 m) each way</div>
                </div>
              </button>

              {/* Totals */}
              <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-lg p-3 space-y-1">
                <h3 className="font-semibold text-white text-sm">Total Distance</h3>
                <div className="flex items-baseline gap-2">
                  <div className="text-lg font-semibold text-indigo-300">
                    {totalDistanceMiles.toFixed(2)} mi
                  </div>
                  <div className="text-xs text-indigo-200">
                    ({totalDistanceKm.toFixed(2)} km)
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDistanceDialogOpen(false)}
              className="cursor-pointer rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-500 hover:text-white flex items-center gap-2 w-full justify-center"
            >
              <FontAwesomeIcon icon={faXmark} className="size-4" />
              Close
            </button>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog open={changeDialogOpen} onClose={() => undoChange()} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/60" />
        <div className="fixed inset-x-0 top-0 flex justify-center pt-2">
          <DialogPanel className="bg-gray-700 rounded-lg p-6 mx-4 w-full max-w-sm shadow-xl text-left">
            <DialogTitle className="text-lg font-medium text-white mb-3">
              Keep or delete your workout?
            </DialogTitle>
            <p className="text-sm text-gray-300 mb-4">
              You changed the target distance or number of hills. What would you like to do?
            </p>
              <div className="flex flex-col gap-2 mb-4">
              <button
                type="button"
                onClick={() => handleChangePreference('delete')}
                className="cursor-pointer w-full text-left rounded-md bg-red-800 px-4 py-2 hover:bg-red-700 active:bg-red-600 focus:outline-2 focus:outline-red-700 text-white font-medium flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faTrash} className="size-4" />
                <span>Delete my workout</span>
              </button>
              <button
                type="button"
                onClick={() => handleChangePreference('keep')}
                className="cursor-pointer w-full text-left rounded-md bg-green-800 px-4 py-2 hover:bg-green-700 active:bg-green-600 focus:outline-2 focus:outline-green-700 text-white font-medium flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faCircleCheck} className="size-4" />
                <span>Keep my workout (I&apos;ll fix it)</span>
              </button>
              <button
                type="button"
                onClick={() => undoChange()}
                className="cursor-pointer w-full text-left rounded-md bg-gray-600 px-4 py-2 hover:bg-gray-500 focus:outline-2 focus:outline-gray-600 text-white font-medium flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faRotateLeft} className="size-4" />
                <span>Undo this change</span>
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
