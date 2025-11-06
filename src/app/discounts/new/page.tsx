import DiscountForm from '../components/DiscountForm';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
export default function NewDiscountPage() {
  return (
    <DefaultLayout>
      <DiscountForm params={{ id: 'new' }} />
    </DefaultLayout>
  );
} 