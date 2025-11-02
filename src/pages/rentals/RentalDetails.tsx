import { RentalReviewDialog } from '@/components/reviews/RentalReviewDialog';
import { UserReviews } from '@/components/reviews/UserReviews';

const RentalDetails = () => {
  const canReview = rental?.status === 'completed' && !rental.reviewed;

  return (
    <div className="container mx-auto py-8">
      {canReview && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Laisser un avis</h2>
          <div className="grid gap-4">
            {user?.id === rental.renter_id && (
              <RentalReviewDialog
                rentalId={rental.id}
                reviewerId={user.id}
                reviewedId={rental.owner_id}
                reviewerRole="renter"
                onReviewSubmitted={() => {
                  // Rafraîchir les détails de la location
                  fetchRentalDetails();
                }}
              />
            )}
            {user?.id === rental.owner_id && (
              <RentalReviewDialog
                rentalId={rental.id}
                reviewerId={user.id}
                reviewedId={rental.renter_id}
                reviewerRole="owner"
                onReviewSubmitted={() => {
                  // Rafraîchir les détails de la location
                  fetchRentalDetails();
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Afficher les avis */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Avis</h2>
        <div className="grid gap-8">
          {user?.id === rental.renter_id && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Avis sur le propriétaire</h3>
              <UserReviews userId={rental.owner_id} />
            </div>
          )}
          {user?.id === rental.owner_id && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Avis sur le locataire</h3>
              <UserReviews userId={rental.renter_id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RentalDetails; 