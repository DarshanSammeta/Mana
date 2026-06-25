"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { BookingStatusTracker } from "@/components/common/BookingStatusTracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, use } from "react";
import { toast } from "react-hot-toast";
import { useSocketStore } from "@/store/socketStore";
import {
  Users,
  Phone,
  CheckCircle2,
  MapPin,
  Clock,
  Calendar,
  ChevronLeft,
  MoreVertical,
  ShieldCheck,
  ClipboardList,
  MessageSquare,
  Trash2,
  PlusCircle
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function VendorBookingDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { accessToken } = useAuthStore();
  const { socket } = useSocketStore();
  const queryClient = useQueryClient();
  const [otp, setOtp] = useState("");
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", role: "", phone: "" });
  const [checklist, setChecklist] = useState([
    { id: 1, task: "Equipment Check", completed: true },
    { id: 2, task: "Team Briefing", completed: false },
    { id: 3, task: "Venue Arrival", completed: false },
    { id: 4, task: "Service Setup", completed: false },
  ]);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const res = await axios.get(`/api/bookings/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    },
    enabled: !!accessToken && !!id,
  });

  const { data: team } = useQuery({
    queryKey: ["booking-team", id],
    queryFn: async () => {
        const res = await axios.get(`/api/bookings/${id}/team`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return res.data;
    },
    enabled: !!accessToken && !!id,
  });

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await axios.patch(`/api/bookings/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      socket?.emit("booking:update_status", { bookingId: id, status: data.status });
      toast.success(`Status updated to ${data.status.replace(/_/g, ' ')}`);
    },
  });

  const { mutate: verifyOtp, isPending: isVerifying } = useMutation({
    mutationFn: async () => {
      const res = await axios.patch("/api/bookings/otp", { bookingId: id, otp }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    },
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["booking", id] });
        socket?.emit("booking:update_status", { bookingId: id, status: "EVENT_STARTED" });
        toast.success("OTP Verified! Event Started.");
    },
    onError: (err: any) => {
        toast.error(err.response?.data?.message || "Invalid OTP");
    }
  });

  const { mutate: addStaff, isPending: isAddingStaff } = useMutation({
    mutationFn: async (staffData: typeof newStaff) => {
      const res = await axios.post(`/api/bookings/${id}/team`, staffData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-team", id] });
      setIsStaffModalOpen(false);
      setNewStaff({ name: "", role: "", phone: "" });
      toast.success("Staff member added");
    },
  });

  const { mutate: removeStaff } = useMutation({
    mutationFn: async (staffId: string) => {
      await axios.delete(`/api/bookings/${id}/team?staffId=${staffId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-team", id] });
      toast.success("Staff member removed");
    },
  });

  const toggleChecklist = (taskId: number) => {
    setChecklist(prev => prev.map(item =>
        item.id === taskId ? { ...item, completed: !item.completed } : item
    ));
  };

  if (isLoading) return <div className="container py-8">Loading...</div>;
  if (!booking) return <div className="container py-8">Booking not found.</div>;

  const isEventDay = format(new Date(booking.eventDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
           <Link href="/vendor/bookings" className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors">
              <ChevronLeft className="h-4 w-4" /> Back to Bookings
           </Link>
           <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-gray-900">Event Management</h1>
              <Badge className="bg-primary/10 text-primary border-none font-bold uppercase text-[10px]">
                {booking.status.replace(/_/g, ' ')}
              </Badge>
           </div>
           <p className="text-sm text-gray-500">Booking #{booking.bookingNumber} • {format(new Date(booking.eventDate), 'PPP')}</p>
        </div>
        <div className="flex items-center gap-3">
           {isEventDay && (
              <Badge className="bg-rose-100 text-rose-700 animate-pulse border-none px-3 py-1 font-black">
                 LIVE EVENT DAY
              </Badge>
           )}
           <Button variant="outline" className="rounded-xl font-bold">
              <MoreVertical className="h-4 w-4" />
           </Button>
        </div>
      </div>

      {/* Real-time Status */}
      <Card className="border-none shadow-xl shadow-gray-100 rounded-[32px] overflow-hidden">
         <CardContent className="p-0">
            <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
               <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Service Flow Tracker</h3>
               <span className="text-[10px] font-bold text-gray-400">Updates in real-time</span>
            </div>
            <BookingStatusTracker currentStatus={booking.status} />
         </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Management Hub */}
        <div className="lg:col-span-8 space-y-8">

           {/* Event Day Checklist */}
           <Card className="border-gray-100 rounded-3xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50">
                 <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg font-bold">Event Day Checklist</CardTitle>
                 </div>
                 <span className="text-xs font-bold text-gray-400">
                    {checklist.filter(c => c.completed).length}/{checklist.length} Completed
                 </span>
              </CardHeader>
              <CardContent className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {checklist.map((item) => (
                       <div
                        key={item.id}
                        onClick={() => toggleChecklist(item.id)}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer",
                          item.completed ? "bg-green-50 border-green-100 text-green-700" : "bg-white border-gray-100 hover:border-primary/20"
                        )}
                       >
                          <div className={cn(
                             "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors",
                             item.completed ? "bg-green-500 border-green-500" : "border-gray-200"
                          )}>
                             {item.completed && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </div>
                          <span className="text-sm font-bold">{item.task}</span>
                       </div>
                    ))}
                 </div>
              </CardContent>
           </Card>

           {/* Client & Venue Info */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-gray-100 rounded-3xl shadow-sm">
                 <CardHeader className="border-b border-gray-50">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-400">Client Details</CardTitle>
                 </CardHeader>
                 <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600">
                          {booking.customer.fullName.substring(0, 2).toUpperCase()}
                       </div>
                       <div>
                          <h4 className="font-bold text-gray-900">{booking.customer.fullName}</h4>
                          <p className="text-xs text-gray-500">{booking.customer.email}</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <Button className="flex-1 bg-white border-gray-200 text-gray-900 hover:bg-gray-50 rounded-xl font-bold border h-10">
                          <Phone className="h-4 w-4 mr-2" /> Call
                       </Button>
                       <Button className="flex-1 bg-white border-gray-200 text-gray-900 hover:bg-gray-50 rounded-xl font-bold border h-10">
                          <MessageSquare className="h-4 w-4 mr-2" /> Chat
                       </Button>
                    </div>
                 </CardContent>
              </Card>

              <Card className="border-gray-100 rounded-3xl shadow-sm">
                 <CardHeader className="border-b border-gray-50">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-400">Venue Details</CardTitle>
                 </CardHeader>
                 <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-3">
                       <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                       <p className="text-sm font-bold text-gray-900">{booking.eventLocation}</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <Clock className="h-5 w-5 text-primary" />
                       <p className="text-sm font-bold text-gray-900">{booking.eventTime || 'TBD'}</p>
                    </div>
                    <Button variant="link" className="text-primary font-bold p-0 h-auto text-xs">
                       Open in Google Maps
                    </Button>
                 </CardContent>
              </Card>
           </div>
        </div>

        {/* Right Column: Actions & Team */}
        <div className="lg:col-span-4 space-y-8">

           {/* Primary Actions */}
           <Card className="bg-primary text-white rounded-[32px] shadow-xl shadow-primary/20 border-none overflow-hidden">
              <CardHeader>
                 <CardTitle className="text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Quick Actions
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 {booking.status === "CONFIRMED" && (
                     <Button className="w-full bg-white text-primary hover:bg-gray-100 rounded-2xl h-12 font-black shadow-lg" onClick={() => updateStatus("VENDOR_TRAVELING")} disabled={isUpdating}>
                         START TRAVELING
                     </Button>
                 )}
                 {booking.status === "VENDOR_TRAVELING" && (
                     <Button className="w-full bg-white text-primary hover:bg-gray-100 rounded-2xl h-12 font-black shadow-lg" onClick={() => updateStatus("OTP_VERIFICATION_PENDING")} disabled={isUpdating}>
                         I HAVE ARRIVED
                     </Button>
                 )}
                 {booking.status === "OTP_VERIFICATION_PENDING" && (
                     <div className="space-y-3 bg-white/10 p-4 rounded-2xl">
                         <p className="text-xs font-black uppercase tracking-widest">Verify Customer OTP</p>
                         <Input
                             placeholder="6-digit code"
                             value={otp}
                             onChange={(e) => setOtp(e.target.value)}
                             maxLength={6}
                             className="bg-white border-none text-primary font-black text-center text-lg h-12 rounded-xl placeholder:text-gray-300"
                         />
                         <Button className="w-full bg-white text-primary hover:bg-gray-100 rounded-xl h-10 font-black" onClick={() => verifyOtp()} disabled={isVerifying || otp.length < 6}>
                             {isVerifying ? "VERIFYING..." : "START SERVICE"}
                         </Button>
                     </div>
                 )}
                 {booking.status === "EVENT_STARTED" && (
                      <Button className="w-full bg-white text-primary hover:bg-gray-100 rounded-2xl h-12 font-black shadow-lg" onClick={() => updateStatus("EVENT_COMPLETED")} disabled={isUpdating}>
                         MARK AS COMPLETED
                     </Button>
                 )}
                 <p className="text-[10px] text-center text-white/60 font-medium">Status updates will be visible to the customer immediately.</p>
              </CardContent>
           </Card>

           {/* Event Team */}
           <Card className="border-gray-100 rounded-3xl shadow-sm">
              <CardHeader className="border-b border-gray-50 flex flex-row items-center justify-between">
                 <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-400">Event Team</CardTitle>
                 <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                    onClick={() => setIsStaffModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 text-gray-400" />
                 </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                 {team?.length > 0 ? (
                   team.map((member: any, i: number) => (
                    <div key={i} className="flex items-center justify-between group">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                             {member.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-gray-900">{member.name}</p>
                             <p className="text-[10px] text-gray-500 font-medium">{member.role}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg">
                             <Phone className="h-3.5 w-3.5 text-gray-400" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => removeStaff(member.id)}
                          >
                             <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                       </div>
                    </div>
                   ))
                 ) : (
                    <div className="py-8 text-center">
                       <p className="text-xs text-gray-400">No staff assigned yet</p>
                       <Button
                          variant="link"
                          className="text-primary text-xs font-bold"
                          onClick={() => setIsStaffModalOpen(true)}
                        >
                          Add Team Member
                       </Button>
                    </div>
                 )}
                 <Button className="w-full bg-gray-50 text-gray-600 hover:bg-gray-100 border-none rounded-xl h-10 font-bold text-xs">
                    View Entire Team
                 </Button>
              </CardContent>
           </Card>

        </div>
      </div>

      {/* Staff Assignment Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full rounded-[32px] overflow-hidden">
             <CardHeader className="bg-gray-50 border-b border-gray-100">
                <CardTitle className="text-lg font-black text-gray-900">Add Team Member</CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Name</label>
                   <Input
                      placeholder="e.g. John Doe"
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                      className="rounded-xl border-gray-200"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Role / Designation</label>
                   <Input
                      placeholder="e.g. Photographer, Assistant"
                      value={newStaff.role}
                      onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                      className="rounded-xl border-gray-200"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Contact Number</label>
                   <Input
                      placeholder="+91 XXXXX XXXXX"
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                      className="rounded-xl border-gray-200"
                   />
                </div>
                <div className="flex gap-3 pt-4">
                   <Button
                      variant="outline"
                      className="flex-1 rounded-xl font-bold"
                      onClick={() => setIsStaffModalOpen(false)}
                   >
                      Cancel
                   </Button>
                   <Button
                      className="flex-1 bg-primary text-white rounded-xl font-black"
                      onClick={() => addStaff(newStaff)}
                      disabled={isAddingStaff || !newStaff.name || !newStaff.role}
                   >
                      {isAddingStaff ? "Adding..." : "Assign to Event"}
                   </Button>
                </div>
             </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Small helper for Plus icon if not imported
function Plus(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
    )
  }
