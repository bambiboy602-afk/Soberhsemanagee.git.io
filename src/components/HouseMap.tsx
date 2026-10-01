/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Home, Plus, Trash2, User, UserPlus, X, Bed, Layout, Users, CheckCircle, PieChart } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  houseId: string;
}

interface Bed {
  id: string;
  name: string;
  roomId: string;
  houseId: string;
  residentId?: string;
}

interface Resident {
  id: string;
  name: string;
}

export const HouseMap = ({ houseId, isManager }: { houseId: string; isManager: boolean }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [assigningBedId, setAssigningBedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubRooms = onSnapshot(query(collection(db, `houses/${houseId}/rooms`), orderBy('name')), (snapshot) => {
      setRooms(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Room)));
    });
    const unsubBeds = onSnapshot(collection(db, `houses/${houseId}/beds`), (snapshot) => {
      setBeds(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bed)));
    });
    const unsubResidents = onSnapshot(collection(db, `houses/${houseId}/residents`), (snapshot) => {
      setResidents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Resident)));
    });

    return () => { unsubRooms(); unsubBeds(); unsubResidents(); };
  }, [houseId]);

  const addRoom = async () => {
    if (!newRoomName.trim()) return;
    const path = `houses/${houseId}/rooms`;
    try {
      await addDoc(collection(db, path), { name: newRoomName, houseId });
      setNewRoomName('');
      setShowAddRoom(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const addBed = async (roomId: string) => {
    const path = `houses/${houseId}/beds`;
    const roomBeds = beds.filter(b => b.roomId === roomId);
    const bedName = `Bed ${roomBeds.length + 1}`;
    try {
      await addDoc(collection(db, path), { name: bedName, roomId, houseId });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const assignResident = async (bedId: string, residentId: string | null) => {
    const path = `houses/${houseId}/beds/${bedId}`;
    try {
      await updateDoc(doc(db, path), { residentId });
      setAssigningBedId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!window.confirm('Delete this room and all its beds?')) return;
    const path = `houses/${houseId}/rooms/${roomId}`;
    try {
      // Delete beds first
      const roomBeds = beds.filter(b => b.roomId === roomId);
      for (const bed of roomBeds) {
        await deleteDoc(doc(db, `houses/${houseId}/beds/${bed.id}`));
      }
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const deleteBed = async (bedId: string) => {
    const path = `houses/${houseId}/beds/${bedId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const totalCapacity = beds.length;
  const occupiedCount = beds.filter(b => Boolean(b.residentId)).length;
  const availableCount = totalCapacity - occupiedCount;
  const occupancyRate = totalCapacity > 0 ? Math.round((occupiedCount / totalCapacity) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mt-6">
      <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Layout size={24} />
          House Map & Occupancy
        </h2>
        {isManager && (
          <button 
            onClick={() => setShowAddRoom(!showAddRoom)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1 text-sm font-bold"
          >
            <Plus size={18} /> Add Room
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Summary Stats Widget */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <PieChart size={18} className="text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Occupancy Overview</h3>
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
              availableCount > 0 
                ? 'bg-emerald-100 text-emerald-800' 
                : totalCapacity === 0 
                ? 'bg-slate-200 text-slate-600' 
                : 'bg-amber-100 text-amber-800'
            }`}>
              {totalCapacity === 0 
                ? 'No beds configured' 
                : availableCount > 0 
                ? `${availableCount} Bed${availableCount === 1 ? '' : 's'} Available` 
                : 'House Full'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Capacity */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Total Capacity</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-slate-800">{totalCapacity}</span>
                  <span className="text-xs text-slate-500 font-medium">Beds</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{rooms.length} Room{rooms.length === 1 ? '' : 's'}</p>
              </div>
              <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600">
                <Bed size={22} />
              </div>
            </div>

            {/* Current Occupancy */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-indigo-500 tracking-wider">Current Occupancy</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-indigo-700">{occupiedCount}</span>
                  <span className="text-xs text-indigo-500 font-semibold">({occupancyRate}%)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{occupiedCount} Resident{occupiedCount === 1 ? '' : 's'} Assigned</p>
              </div>
              <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                <Users size={22} />
              </div>
            </div>

            {/* Available Beds */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-emerald-600 tracking-wider">Available Beds</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`text-2xl font-black ${availableCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{availableCount}</span>
                  <span className="text-xs text-emerald-600 font-medium">Vacant</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{availableCount > 0 ? 'Ready for intake' : 'No vacancy'}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
                <CheckCircle size={22} />
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          {totalCapacity > 0 && (
            <div className="mt-3 pt-2">
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold mb-1">
                <span>Bed Utilization</span>
                <span>{occupiedCount} of {totalCapacity} Occupied ({occupancyRate}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                <div 
                  className="bg-indigo-600 h-2 transition-all duration-300" 
                  style={{ width: `${occupancyRate}%` }} 
                />
                <div 
                  className="bg-emerald-400 h-2 transition-all duration-300" 
                  style={{ width: `${100 - occupancyRate}%` }} 
                />
              </div>
            </div>
          )}
        </div>

        {showAddRoom && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200 flex gap-2">
            <input 
              placeholder="Room Name (e.g., Room 101, Master Suite)" 
              className="flex-1 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-slate-400"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
            />
            <button onClick={addRoom} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold">Save</button>
            <button onClick={() => setShowAddRoom(false)} className="p-2 text-slate-400"><X size={20}/></button>
          </div>
        )}

        {rooms.length === 0 ? (
          <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-xl">
            <Home size={48} className="mx-auto mb-2 opacity-20" />
            <p>No rooms defined. Start by adding a room.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map(room => (
              <div key={room.id} className="border rounded-xl overflow-hidden bg-slate-50/50 hover:bg-white transition-colors shadow-sm hover:shadow-md">
                <div className="bg-slate-100 p-3 flex justify-between items-center border-b">
                  <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest">{room.name}</h3>
                  {isManager && (
                    <div className="flex gap-1">
                      <button onClick={() => addBed(room.id)} className="p-1 text-slate-400 hover:text-slate-600" title="Add Bed"><Plus size={16}/></button>
                      <button onClick={() => deleteRoom(room.id)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  )}
                </div>
                
                <div className="p-4 space-y-3">
                  {beds.filter(b => b.roomId === room.id).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No beds in this room.</p>
                  ) : (
                    beds.filter(b => b.roomId === room.id).map(bed => {
                      const resident = residents.find(r => r.id === bed.residentId);
                      return (
                        <div key={bed.id} className="flex items-center justify-between p-2 bg-white border rounded-lg shadow-sm">
                          <div className="flex items-center gap-3">
                            <Bed size={18} className={bed.residentId ? "text-indigo-600" : "text-slate-300"} />
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">{bed.name}</p>
                              <p className={`text-sm font-medium ${bed.residentId ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                {resident ? resident.name : 'Unassigned'}
                              </p>
                            </div>
                          </div>
                          
                          {isManager && (
                            <div className="flex gap-1">
                              {assigningBedId === bed.id ? (
                                <div className="flex items-center gap-1">
                                  <select 
                                    className="text-[10px] p-1 border rounded"
                                    onChange={(e) => assignResident(bed.id, e.target.value || null)}
                                    defaultValue={bed.residentId || ''}
                                  >
                                    <option value="">None</option>
                                    {residents.map(r => (
                                      <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                  </select>
                                  <button onClick={() => setAssigningBedId(null)} className="p-1 text-slate-400"><X size={14}/></button>
                                </div>
                              ) : (
                                <>
                                  <button onClick={() => setAssigningBedId(bed.id)} className="p-1 text-indigo-400 hover:text-indigo-600"><UserPlus size={16}/></button>
                                  <button onClick={() => deleteBed(bed.id)} className="p-1 text-slate-200 hover:text-red-400"><X size={16}/></button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-50 p-4 border-t flex flex-wrap justify-center gap-6 md:gap-8 items-center">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="w-3 h-3 bg-indigo-600 rounded-sm"></div> Occupied ({occupiedCount})
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="w-3 h-3 bg-white border border-slate-300 rounded-sm shadow-xs"></div> Available ({availableCount})
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span className="text-slate-800">Total Capacity:</span> {totalCapacity} beds
        </div>
      </div>
    </div>
  );
};
