import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { mockAdminApi, DocumentReview } from "@/lib/mock-admin-data";
import { CheckCircle, XCircle, FileText, Clock } from "lucide-react";
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

const AdminDocumentsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentReview[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedDocument, setSelectedDocument] = useState<DocumentReview | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadDocuments = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = filter === 'pending'
          ? await mockAdminApi.getPendingDocuments()
          : await mockAdminApi.getAllDocumentReviews();
        
        const filtered = filter !== 'all' && filter !== 'pending'
          ? data.filter(d => d.status === filter)
          : data;
        
        setDocuments(filtered);
      } catch (error) {
        console.error('Error loading documents:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [user, filter]);

  const handleApprove = async (documentId: string) => {
    if (!user) return;

    try {
      setProcessing(true);
      await mockAdminApi.approveDocument(documentId, user.id);
      toast.success('Document approuvé avec succès');
      const updated = filter === 'pending'
        ? await mockAdminApi.getPendingDocuments()
        : await mockAdminApi.getAllDocumentReviews();
      setDocuments(filteredDocuments(updated, filter));
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Erreur lors de l\'approbation');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!user || !selectedDocument || !rejectReason.trim()) {
      toast.error('Veuillez indiquer une raison');
      return;
    }

    try {
      setProcessing(true);
      await mockAdminApi.rejectDocument(selectedDocument.id, user.id, rejectReason);
      toast.success('Document rejeté');
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedDocument(null);
      const updated = filter === 'pending'
        ? await mockAdminApi.getPendingDocuments()
        : await mockAdminApi.getAllDocumentReviews();
      setDocuments(filteredDocuments(updated, filter));
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast.error('Erreur lors du rejet');
    } finally {
      setProcessing(false);
    }
  };

  const filteredDocuments = (docs: DocumentReview[], filterType: typeof filter) => {
    if (filterType === 'all' || filterType === 'pending') return docs;
    return docs.filter(d => d.status === filterType);
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      driver_license: 'Permis de conduire',
      identity_card: 'Carte d\'identité',
      bank_details: 'Détails bancaires',
      vehicle_registration: 'Carte grise',
      insurance: 'Assurance'
    };
    return labels[type] || type;
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
          <h1 className="text-3xl font-bold text-gray-900">Vérification des Documents</h1>
          <p className="text-gray-600 mt-2">Approuvez ou rejetez les documents soumis</p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <Select value={filter} onValueChange={(value: typeof filter) => setFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="approved">Approuvés</SelectItem>
              <SelectItem value="rejected">Rejetés</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {documents.length} document(s)
          </Badge>
        </div>

        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((document) => (
              <Card key={document.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{getDocumentTypeLabel(document.document_type)}</CardTitle>
                    <Badge
                      variant={
                        document.status === 'approved' ? 'success' :
                        document.status === 'rejected' ? 'destructive' :
                        'warning'
                      }
                    >
                      {document.status === 'pending' ? 'En attente' :
                       document.status === 'approved' ? 'Approuvé' :
                       'Rejeté'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <p><strong>Utilisateur:</strong> {document.user_name || 'N/A'}</p>
                    <p><strong>Email:</strong> {document.user_email || 'N/A'}</p>
                    <p><strong>Soumis le:</strong> {new Date(document.submitted_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(document.document_url, '_blank')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Voir
                    </Button>
                    {document.status === 'pending' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleApprove(document.id)}
                          disabled={processing}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approuver
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedDocument(document);
                            setRejectDialogOpen(true);
                          }}
                          disabled={processing}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Rejeter
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun document {filter === 'pending' ? 'en attente' : ''}</p>
            </CardContent>
          </Card>
        )}

        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeter le document</DialogTitle>
              <DialogDescription>
                Veuillez indiquer la raison du rejet
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="reason">Raison du rejet *</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Le document est illisible, incomplet, etc."
                rows={4}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={processing}>
                Confirmer le rejet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDocumentsPage;

