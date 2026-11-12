"use client";

import React, { useState } from "react";
import { FacilitySettings, UserProfile, UserRole } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateSettingsAction, createUserAction, updateUserStatusAction, resetDemoDataAction } from "@/app/actions/settings";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { getRoleBadgeClass, formatDateTime } from "@/lib/utils";
import {
  Settings,
  Shield,
  Building2,
  Users,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  UserPlus,
} from "lucide-react";

interface SettingsClientProps {
  initialSettings: FacilitySettings;
  users: UserProfile[];
  currentOccupancy: number;
}

export function SettingsClient({
  initialSettings,
  users,
  currentOccupancy,
}: SettingsClientProps) {
  const { isAdmin, user: currentUser } = useAuth();
  const router = useRouter();

  // Facility Settings Form State
  const [facilityName, setFacilityName] = useState(initialSettings.facility_name);
  const [facilityTimezone, setFacilityTimezone] = useState(initialSettings.facility_timezone);
  const [maximumCapacity, setMaximumCapacity] = useState(initialSettings.maximum_capacity);
  const [feverThreshold, setFeverThreshold] = useState(initialSettings.fever_threshold_celsius);

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // New User Form State
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("nurse");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  // Reset Demo State
  const [isResetting, setIsResetting] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage(null);
    setSettingsError(null);

    if (maximumCapacity < currentOccupancy) {
      setSettingsError(
        `Capacity reduction blocked: Current occupancy is ${currentOccupancy}. Capacity cannot be reduced below active patient census.`
      );
      return;
    }

    setIsSavingSettings(true);
    try {
      const res = await updateSettingsAction({
        facility_name: facilityName,
        facility_timezone: facilityTimezone,
        maximum_capacity: Number(maximumCapacity),
        fever_threshold_celsius: Number(feverThreshold),
      });

      if (!res.success) {
        setSettingsError(res.error || "Failed to update settings.");
      } else {
        setSettingsMessage("Facility parameters successfully updated and audit-logged.");
        router.refresh();
      }
    } catch (err: any) {
      setSettingsError(err?.message || "Unexpected error saving settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);

    setIsCreatingUser(true);
    try {
      const res = await createUserAction({
        email: newEmail,
        full_name: newName,
        role: newRole,
      });

      if (!res.success) {
        setUserError(res.error || "Failed to create user.");
      } else {
        setNewEmail("");
        setNewName("");
        router.refresh();
      }
    } catch (err: any) {
      setUserError(err?.message || "Failed to create user.");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    if (user.id === currentUser?.id) {
      alert("You cannot deactivate your own active session.");
      return;
    }

    const res = await updateUserStatusAction(user.id, user.role, !user.is_active);
    if (!res.success) {
      alert(res.error);
    } else {
      router.refresh();
    }
  };

  const handleResetDemo = async () => {
    if (
      !confirm(
        "Are you sure you want to reset all data back to initial clinical baseline? All newly added patients and test records will be re-seeded."
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await resetDemoDataAction();
      if (res.success) {
        alert(res.message);
        router.refresh();
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy flex items-center gap-2">
            <Settings className="h-6 w-6 text-teal" />
            <span>Facility Configuration & User Access Control</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Admin-only operational controls: Isolation bed capacity, fever thresholds, and RBAC accounts.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleResetDemo}
          disabled={isResetting}
          className="gap-2 text-rose-700 border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-xs"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{isResetting ? "Resetting..." : "Reset Demo Data"}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Facility Parameters Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-teal" />
              <span>Quarantine Center Operating Parameters</span>
            </CardTitle>
            <CardDescription>
              Capacity and clinical thresholds governing transactional admission and discharge logic
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveSettings}>
            <CardContent className="space-y-4">
              {settingsError && (
                <div className="p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-800 text-xs">
                  {settingsError}
                </div>
              )}
              {settingsMessage && (
                <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{settingsMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="facilityName">Facility Name</Label>
                  <Input
                    id="facilityName"
                    value={facilityName}
                    onChange={(e) => setFacilityName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="timezone">Operational Timezone</Label>
                  <Input
                    id="timezone"
                    value={facilityTimezone}
                    onChange={(e) => setFacilityTimezone(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maxCap">Maximum Bed Capacity</Label>
                    <span className="text-[11px] text-slate-500">
                      Current Occupancy: {currentOccupancy} Beds
                    </span>
                  </div>
                  <Input
                    id="maxCap"
                    type="number"
                    min={currentOccupancy}
                    max={200}
                    value={maximumCapacity}
                    onChange={(e) => setMaximumCapacity(Number(e.target.value))}
                    required
                  />
                  <span className="text-[10px] text-slate-400">
                    Baseline: 74 beds. Cannot be reduced below currently active inpatients ({currentOccupancy}).
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="feverThresh">Fever Threshold (°C)</Label>
                    <span className="text-[11px] text-slate-500 font-bold">Standard: 37.5°C</span>
                  </div>
                  <Input
                    id="feverThresh"
                    type="number"
                    step="0.1"
                    min="35.0"
                    max="42.0"
                    value={feverThreshold}
                    onChange={(e) => setFeverThreshold(Number(e.target.value))}
                    required
                  />
                  <span className="text-[10px] text-slate-400">
                    Modifying threshold triggers automatic re-evaluation of 3-day discharge eligibility across all active patients.
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-3">
              <Button type="submit" disabled={isSavingSettings} className="bg-teal hover:bg-teal-700 text-white shadow-xs">
                {isSavingSettings ? "Saving Settings..." : "Save Facility Settings"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Add User Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-teal" />
              <span>Create Staff Account</span>
            </CardTitle>
            <CardDescription>
              Assign role-based access for nurses, physicians, or administrators
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateUser}>
            <CardContent className="space-y-3">
              {userError && (
                <div className="p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-800 text-xs">
                  {userError}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="uName">Full Name & Credentials</Label>
                <Input
                  id="uName"
                  placeholder="e.g. Rachel Adams, RN"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="uEmail">Official Email</Label>
                <Input
                  id="uEmail"
                  type="email"
                  placeholder="nurse.rachel@viruscare.health"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="uRole">Role Assignment</Label>
                <select
                  id="uRole"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm focus:border-teal focus:outline-none"
                >
                  <option value="nurse">Nurse (Record Temperatures & Corrections)</option>
                  <option value="doctor">Doctor (Visits, Clinical Notes & Deceased)</option>
                  <option value="admin">Admin (Facility Management & Discharge)</option>
                </select>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button type="submit" disabled={isCreatingUser} className="w-full bg-navy hover:bg-navy-700 text-white">
                {isCreatingUser ? "Creating Account..." : "Register Staff User"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* User Accounts Management Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-teal" />
            <span>Authorized User Accounts & Role Permissions</span>
          </CardTitle>
          <CardDescription>
            System users with active authentication credentials in Supabase Auth & PostgreSQL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200/80 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>System Role</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-semibold text-navy text-sm">
                      {u.full_name}
                      {u.id === currentUser?.id && (
                        <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                          You
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-slate-600 font-mono">
                      {u.email}
                    </TableCell>

                    <TableCell>
                      <Badge className={getRoleBadgeClass(u.role)}>
                        {u.role.toUpperCase()}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {u.is_active ? (
                        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Deactivated
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-slate-500 tabular-nums">
                      {formatDateTime(u.created_at)}
                    </TableCell>

                    <TableCell className="text-right">
                      {u.id !== currentUser?.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleUserStatus(u)}
                          className="h-7 text-xs text-slate-600 hover:text-navy"
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
