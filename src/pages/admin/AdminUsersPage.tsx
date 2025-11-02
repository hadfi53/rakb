import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { mockAdminApi, AdminUser } from "@/lib/mock-admin-data";
import { Users, Search, Ban, UserCheck, UserX, Shield } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminUsersPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'renter' | 'owner' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'unsuspend' | 'ban' | 'changeRole'>('suspend');
  const [actionReason, setActionReason] = useState('');
  const [newRole, setNewRole] = useState<'renter' | 'owner' | 'admin'>('renter');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const params: any = {};
        if (roleFilter !== 'all') params.role = roleFilter;
        if (statusFilter !== 'all') params.status = statusFilter;
        if (searchTerm) params.search = searchTerm;
        
        const data = await mockAdminApi.getUsers(params);
        setUsers(data);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [user, roleFilter, statusFilter, searchTerm]);

  const handleAction = async () => {
    if (!user || !selectedUser) return;

    try {
      setProcessing(true);
      
      switch (actionType) {
        case 'suspend':
          if (!actionReason.trim()) {
            toast.error('Veuillez indiquer une raison');
            return;
          }
          await mockAdminApi.suspendUser(selectedUser.id, user.id, actionReason);
          toast.success('Utilisateur suspendu');
          break;
        case 'unsuspend':
          await mockAdminApi.unsuspendUser(selectedUser.id, user.id);
          toast.success('Utilisateur réactivé');
          break;
        case 'ban':
          if (!actionReason.trim()) {
            toast.error('Veuillez indiquer une raison');
            return;
          }
          await mockAdminApi.banUser(selectedUser.id, user.id, actionReason);
          toast.success('Utilisateur banni');
          break;
        case 'changeRole':
          await mockAdminApi.updateUserRole(selectedUser.id, newRole, user.id);
          toast.success('Rôle modifié');
          break;
      }
      
      setActionDialogOpen(false);
      setActionReason('');
      setSelectedUser(null);
      
      // Reload users
      const params: any = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const updated = await mockAdminApi.getUsers(params);
      setUsers(updated);
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error('Erreur lors de l\'action');
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (
    user: AdminUser,
    type: 'suspend' | 'unsuspend' | 'ban' | 'changeRole'
  ) => {
    setSelectedUser(user);
    setActionType(type);
    setActionDialogOpen(true);
    if (type === 'changeRole') {
      setNewRole(user.role);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="text-gray-600 mt-2">Gérez les utilisateurs de la plateforme</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={(value: typeof roleFilter) => setRoleFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="renter">Locataire</SelectItem>
                  <SelectItem value="owner">Propriétaire</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value: typeof statusFilter) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                  <SelectItem value="banned">Banni</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="text-lg px-4 py-2 flex items-center justify-center">
                {users.length} utilisateur(s)
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Utilisateur</th>
                      <th className="text-left py-3 px-4 font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-medium">Rôle</th>
                      <th className="text-left py-3 px-4 font-medium">Vérifications</th>
                      <th className="text-left py-3 px-4 font-medium">Statut</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {u.first_name} {u.last_name}
                        </td>
                        <td className="py-3 px-4">{u.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant={u.role === 'admin' ? 'purple' : u.role === 'owner' ? 'info' : 'default'}>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {u.verified_tenant && <Badge variant="success" className="text-xs">Locataire</Badge>}
                            {u.verified_host && <Badge variant="success" className="text-xs">Hôte</Badge>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              u.status === 'active' ? 'success' :
                              u.status === 'suspended' ? 'warning' :
                              'destructive'
                            }
                          >
                            {u.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {u.status === 'active' ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openActionDialog(u, 'suspend')}
                                >
                                  <UserX className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openActionDialog(u, 'ban')}
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => openActionDialog(u, 'unsuspend')}
                              >
                                <UserCheck className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openActionDialog(u, 'changeRole')}
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun utilisateur trouvé</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'suspend' && 'Suspendre l\'utilisateur'}
                {actionType === 'unsuspend' && 'Réactiver l\'utilisateur'}
                {actionType === 'ban' && 'Bannir l\'utilisateur'}
                {actionType === 'changeRole' && 'Modifier le rôle'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'suspend' && 'Veuillez indiquer la raison de la suspension'}
                {actionType === 'unsuspend' && 'Réactiver cet utilisateur ?'}
                {actionType === 'ban' && 'Veuillez indiquer la raison du bannissement'}
                {actionType === 'changeRole' && 'Choisir le nouveau rôle'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {(actionType === 'suspend' || actionType === 'ban') && (
                <div>
                  <Label htmlFor="reason">Raison *</Label>
                  <Textarea
                    id="reason"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Raison de l'action..."
                    rows={3}
                    className="mt-2"
                  />
                </div>
              )}
              {actionType === 'changeRole' && (
                <div>
                  <Label htmlFor="role">Nouveau rôle</Label>
                  <Select value={newRole} onValueChange={(value: typeof newRole) => setNewRole(value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="renter">Locataire</SelectItem>
                      <SelectItem value="owner">Propriétaire</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                variant={actionType === 'ban' ? 'destructive' : 'default'}
                onClick={handleAction}
                disabled={processing}
              >
                Confirmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminUsersPage;

