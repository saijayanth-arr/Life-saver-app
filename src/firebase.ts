import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  setDoc 
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase using the provisioned credentials
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific database ID if provided in config, otherwise standard
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export { db };

// Interface for Cyber Task
export interface CyberTask {
  id: string;
  title: string;
  description?: string;
  deadline: string; // ISO date-time string
  impact: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"; // Stakes
  procrastination: "SEVERE" | "HIGH" | "AVERAGE" | "LOW";
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "FAILED";
  category: string;
  createdAt: string;
  substeps?: CyberSubstep[];
  reminderSent?: boolean;
}

export interface CyberSubstep {
  id: number;
  title: string;
  action: string;
  duration: number; // in minutes
  completed: boolean;
}

// Interface for Habits
export interface CyberHabit {
  id: string;
  title: string;
  frequency: "DAILY" | "WEEKLY";
  streak: number;
  lastCompleted?: string; // YYYY-MM-DD
  status: "ACTIVE" | "CRITICAL";
}

// Interface for Goals
export interface CyberGoal {
  id: string;
  title: string;
  targetDate: string;
  progress: number; // 0 to 100
  status: "ACTIVE" | "ACHIEVED" | "ABANDONED";
}

// Listener registries for offline-first local storage fallback
type Listener<T> = (data: T[]) => void;
const taskListeners = new Set<Listener<CyberTask>>();
const habitListeners = new Set<Listener<CyberHabit>>();
const goalListeners = new Set<Listener<CyberGoal>>();

function getLocalTasks(): CyberTask[] {
  try {
    const val = localStorage.getItem("lifesaver_tasks");
    return val ? JSON.parse(val) : [];
  } catch (e) {
    return [];
  }
}

function setLocalTasks(tasks: CyberTask[], notify = true) {
  try {
    localStorage.setItem("lifesaver_tasks", JSON.stringify(tasks));
  } catch (e) {}
  if (notify) {
    taskListeners.forEach(listener => listener(tasks));
  }
}

function getLocalHabits(): CyberHabit[] {
  try {
    const val = localStorage.getItem("lifesaver_habits");
    return val ? JSON.parse(val) : [];
  } catch (e) {
    return [];
  }
}

function setLocalHabits(habits: CyberHabit[], notify = true) {
  try {
    localStorage.setItem("lifesaver_habits", JSON.stringify(habits));
  } catch (e) {}
  if (notify) {
    habitListeners.forEach(listener => listener(habits));
  }
}

function getLocalGoals(): CyberGoal[] {
  try {
    const val = localStorage.getItem("lifesaver_goals");
    return val ? JSON.parse(val) : [];
  } catch (e) {
    return [];
  }
}

function setLocalGoals(goals: CyberGoal[], notify = true) {
  try {
    localStorage.setItem("lifesaver_goals", JSON.stringify(goals));
  } catch (e) {}
  if (notify) {
    goalListeners.forEach(listener => listener(goals));
  }
}

// Helper to listen for real-time Task updates
export function subscribeTasks(onUpdate: (tasks: CyberTask[]) => void) {
  // Immediately supply local cache
  onUpdate(getLocalTasks());
  taskListeners.add(onUpdate);

  try {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const tasks: CyberTask[] = [];
      snapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() } as CyberTask);
      });
      setLocalTasks(tasks, true);
    }, (error) => {
      console.warn("Firestore Tasks Subscription error, using local fallback:", error);
    });
    return () => {
      taskListeners.delete(onUpdate);
      unsub();
    };
  } catch (error) {
    console.error("Firestore failed to initialize Tasks subscription:", error);
    return () => {
      taskListeners.delete(onUpdate);
    };
  }
}

// Helper to listen for Habits updates
export function subscribeHabits(onUpdate: (habits: CyberHabit[]) => void) {
  // Immediately supply local cache
  onUpdate(getLocalHabits());
  habitListeners.add(onUpdate);

  try {
    const q = query(collection(db, "habits"));
    const unsub = onSnapshot(q, (snapshot) => {
      const habits: CyberHabit[] = [];
      snapshot.forEach((doc) => {
        habits.push({ id: doc.id, ...doc.data() } as CyberHabit);
      });
      setLocalHabits(habits, true);
    }, (error) => {
      console.warn("Firestore Habits Subscription error, using local fallback:", error);
    });
    return () => {
      habitListeners.delete(onUpdate);
      unsub();
    };
  } catch (error) {
    console.error("Firestore failed to initialize Habits subscription:", error);
    return () => {
      habitListeners.delete(onUpdate);
    };
  }
}

// Helper to listen for Goals updates
export function subscribeGoals(onUpdate: (goals: CyberGoal[]) => void) {
  // Immediately supply local cache
  onUpdate(getLocalGoals());
  goalListeners.add(onUpdate);

  try {
    const q = query(collection(db, "goals"));
    const unsub = onSnapshot(q, (snapshot) => {
      const goals: CyberGoal[] = [];
      snapshot.forEach((doc) => {
        goals.push({ id: doc.id, ...doc.data() } as CyberGoal);
      });
      setLocalGoals(goals, true);
    }, (error) => {
      console.warn("Firestore Goals Subscription error, using local fallback:", error);
    });
    return () => {
      goalListeners.delete(onUpdate);
      unsub();
    };
  } catch (error) {
    console.error("Firestore failed to initialize Goals subscription:", error);
    return () => {
      goalListeners.delete(onUpdate);
    };
  }
}

// Clean undefined or invalid data for Firestore
function cleanFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return null;
  }
  if (Array.isArray(data)) {
    return data.map(cleanFirestoreData);
  }
  if (typeof data === "object") {
    const cleaned: any = {};
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (val !== undefined) {
        cleaned[key] = cleanFirestoreData(val);
      }
    }
    return cleaned;
  }
  return data;
}

// Core DB operations
export async function saveTask(task: Omit<CyberTask, "id"> & { id?: string }) {
  const localTasks = getLocalTasks();
  let targetId = task.id;

  if (targetId) {
    const updated = localTasks.map(t => t.id === targetId ? { ...t, ...task, id: targetId } : t) as CyberTask[];
    setLocalTasks(updated);
  } else {
    targetId = "task_" + Math.random().toString(36).substring(2, 11);
    const newTask = { ...task, id: targetId } as CyberTask;
    setLocalTasks([newTask, ...localTasks]);
  }

  try {
    const ref = doc(db, "tasks", targetId);
    const cleaned = cleanFirestoreData(task);
    await setDoc(ref, cleaned);
  } catch (error) {
    console.warn("Firestore saveTask failed, relying on localStorage:", error);
  }

  return targetId;
}

export async function deleteTask(id: string) {
  const localTasks = getLocalTasks();
  setLocalTasks(localTasks.filter(t => t.id !== id));

  try {
    await deleteDoc(doc(db, "tasks", id));
  } catch (error) {
    console.warn("Firestore deleteTask failed, relying on localStorage:", error);
  }
}

export async function saveHabit(habit: Omit<CyberHabit, "id"> & { id?: string }) {
  const localHabits = getLocalHabits();
  let targetId = habit.id;

  if (targetId) {
    const updated = localHabits.map(h => h.id === targetId ? { ...h, ...habit, id: targetId } : h) as CyberHabit[];
    setLocalHabits(updated);
  } else {
    targetId = "habit_" + Math.random().toString(36).substring(2, 11);
    const newHabit = { ...habit, id: targetId } as CyberHabit;
    setLocalHabits([...localHabits, newHabit]);
  }

  try {
    const ref = doc(db, "habits", targetId);
    const cleaned = cleanFirestoreData(habit);
    await setDoc(ref, cleaned);
  } catch (error) {
    console.warn("Firestore saveHabit failed, relying on localStorage:", error);
  }

  return targetId;
}

export async function deleteHabit(id: string) {
  const localHabits = getLocalHabits();
  setLocalHabits(localHabits.filter(h => h.id !== id));

  try {
    await deleteDoc(doc(db, "habits", id));
  } catch (error) {
    console.warn("Firestore deleteHabit failed, relying on localStorage:", error);
  }
}

export async function saveGoal(goal: Omit<CyberGoal, "id"> & { id?: string }) {
  const localGoals = getLocalGoals();
  let targetId = goal.id;

  if (targetId) {
    const updated = localGoals.map(g => g.id === targetId ? { ...g, ...goal, id: targetId } : g) as CyberGoal[];
    setLocalGoals(updated);
  } else {
    targetId = "goal_" + Math.random().toString(36).substring(2, 11);
    const newGoal = { ...goal, id: targetId } as CyberGoal;
    setLocalGoals([...localGoals, newGoal]);
  }

  try {
    const ref = doc(db, "goals", targetId);
    const cleaned = cleanFirestoreData(goal);
    await setDoc(ref, cleaned);
  } catch (error) {
    console.warn("Firestore saveGoal failed, relying on localStorage:", error);
  }

  return targetId;
}

export async function deleteGoal(id: string) {
  const localGoals = getLocalGoals();
  setLocalGoals(localGoals.filter(g => g.id !== id));

  try {
    await deleteDoc(doc(db, "goals", id));
  } catch (error) {
    console.warn("Firestore deleteGoal failed, relying on localStorage:", error);
  }
}
