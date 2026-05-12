import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  TextInput,
  Textarea,
  Select,
  Button,
  Card,
  Badge,
  Group,
  Stack,
  Loader,
  Pagination,
  SegmentedControl,
  Modal,
  Grid,
  Paper,

} from '@mantine/core';
import { useForm } from '@mantine/form';
import { 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Search,
  Filter
} from 'lucide-react';
import api from '../utils/api';

interface FeedbackItem {
  id: string;
  type: 'complaint' | 'suggestion' | 'review';
  subject: string;
  message: string;
  rating?: number;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  admin_response?: string;
  responded_by?: string;
  created_at: string;
  responded_at?: string;
  customers?: {
    id: string;
    full_name: string;
    account_no: string;
    phone: string;
  };
}

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [responding, setResponding] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  const itemsPerPage = 10;

  // Form for responding to feedback
  const responseForm = useForm({
    initialValues: {
      admin_response: '',
      status: 'resolved',
    },
    validate: {
      admin_response: (value:any) => (!value ? 'Response message is required' : null),
    },
  });

  // Fetch all feedback
  const fetchFeedback = async () => {
    setLoading(true);
    try {
      let url = '/feedback';
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await api.get(url);
      if (response.data.success) {
        setFeedback(response.data.data);
      }
    } catch (error: any) {
      alert('❌ Error: ' + (error.response?.data?.message || 'Failed to load feedback'));
    } finally {
      setLoading(false);
    }
  };

  // Respond to feedback
  const handleRespond = async (id: string, values: { admin_response: string; status: string }) => {
    setResponding(true);
    try {
      const response = await api.patch(`/feedback/${id}/respond`, {
        admin_response: values.admin_response,
        status: values.status,
      });
      if (response.data.success) {
        alert('✅ Response sent successfully!');
        setModalOpen(false);
        responseForm.reset();
        fetchFeedback();
      }
    } catch (error: any) {
      alert('❌ Error: ' + (error.response?.data?.message || 'Failed to send response'));
    } finally {
      setResponding(false);
    }
  };

  // Update status only
  const handleStatusUpdate = async (id: string, status: string) => {
    setUpdatingStatus(true);
    try {
      const response = await api.patch(`/feedback/${id}/status`, { status });
      if (response.data.success) {
        alert(`✅ Status updated to ${status}`);
        fetchFeedback();
      }
    } catch (error: any) {
      alert('❌ Error: ' + (error.response?.data?.message || 'Failed to update status'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Open response modal
  const openResponseModal = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback);
    responseForm.setValues({
      admin_response: feedback.admin_response || '',
      status: feedback.status,
    });
    setModalOpen(true);
  };

  // Filter and search feedback
  const filteredFeedback = feedback.filter(fb => {
    const matchesSearch = searchTerm === '' || 
      fb.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.customers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.customers?.account_no?.includes(searchTerm);
    
    return matchesSearch;
  });

  // Pagination
  const paginatedFeedback = filteredFeedback.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Load feedback when filters change
  useEffect(() => {
    fetchFeedback();
  }, [filterType, filterStatus]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterStatus, searchTerm]);

  // Get status badge color and icon
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open': return { color: 'yellow', icon: <Clock size={14} />, label: 'OPEN' };
      case 'in_progress': return { color: 'blue', icon: <Clock size={14} />, label: 'IN PROGRESS' };
      case 'resolved': return { color: 'green', icon: <CheckCircle size={14} />, label: 'RESOLVED' };
      case 'closed': return { color: 'gray', icon: <XCircle size={14} />, label: 'CLOSED' };
      default: return { color: 'gray', icon: null, label: status.toUpperCase() };
    }
  };

  // Get type badge color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'complaint': return 'red';
      case 'suggestion': return 'teal';
      case 'review': return 'violet';
      default: return 'gray';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Statistics
  const stats = {
    total: feedback.length,
    open: feedback.filter(f => f.status === 'open').length,
    inProgress: feedback.filter(f => f.status === 'in_progress').length,
    resolved: feedback.filter(f => f.status === 'resolved').length,
    complaints: feedback.filter(f => f.type === 'complaint').length,
    suggestions: feedback.filter(f => f.type === 'suggestion').length,
    reviews: feedback.filter(f => f.type === 'review').length,
  };

  return (
    <Container size="xl" py="xl">
      <Title order={1} className="mb-2">
        Admin Feedback Dashboard
      </Title>
      <p className="text-gray-600 mb-6">
        Manage and respond to customer feedback
      </p>

      {/* Statistics Cards */}
      <Grid mb="lg">
        <Grid.Col span={{ base: 6, md: 2 }}>
          <Paper withBorder p="md" radius="md" className="text-center">
            <Title order={3}>{stats.total}</Title>
            <span className="text-xs text-gray-500">Total</span>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 2 }}>
          <Paper withBorder p="md" radius="md" className="text-center" bg="yellow.0">
            <Title order={3} c="yellow.7">{stats.open}</Title>
            <span className="text-xs text-gray-500">Open</span>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 2 }}>
          <Paper withBorder p="md" radius="md" className="text-center" bg="blue.0">
            <Title order={3} c="blue.7">{stats.inProgress}</Title>
            <span className="text-xs text-gray-500">In Progress</span>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 2 }}>
          <Paper withBorder p="md" radius="md" className="text-center" bg="green.0">
            <Title order={3} c="green.7">{stats.resolved}</Title>
            <span className="text-xs text-gray-500">Resolved</span>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 2 }}>
          <Paper withBorder p="md" radius="md" className="text-center">
            <Title order={3}>{stats.complaints}</Title>
            <span className="text-xs text-gray-500">Complaints</span>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 2 }}>
          <Paper withBorder p="md" radius="md" className="text-center">
            <Title order={3}>{stats.suggestions + stats.reviews}</Title>
            <span className="text-xs text-gray-500">Suggestions/Reviews</span>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Filters */}
      <Card withBorder radius="md" p="md" mb="lg">
        <Stack gap="md">
          <Group justify="space-between" wrap="wrap">
            <Group gap="md">
              <Filter size={18} />
              <span className="font-semibold">Filters:</span>
              <SegmentedControl
                value={filterType}
                onChange={setFilterType}
                data={[
                  { label: 'All Types', value: 'all' },
                  { label: 'Complaints', value: 'complaint' },
                  { label: 'Suggestions', value: 'suggestion' },
                  { label: 'Reviews', value: 'review' },
                ]}
                size="xs"
              />
              <SegmentedControl
                value={filterStatus}
                onChange={setFilterStatus}
                data={[
                  { label: 'All Status', value: 'all' },
                  { label: 'Open', value: 'open' },
                  { label: 'In Progress', value: 'in_progress' },
                  { label: 'Resolved', value: 'resolved' },
                  { label: 'Closed', value: 'closed' },
                ]}
                size="xs"
              />
            </Group>
            
            <TextInput
              placeholder="Search by subject, message, customer..."
              leftSection={<Search size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 300 }}
            />
          </Group>
        </Stack>
      </Card>

      {/* Feedback List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader size="xl" />
        </div>
      ) : paginatedFeedback.length === 0 ? (
        <Card withBorder p="xl" className="text-center">
          <p className="text-gray-500">No feedback found</p>
        </Card>
      ) : (
        <Stack gap="md">
          {paginatedFeedback.map((item) => {
            const statusConfig = getStatusConfig(item.status);
            return (
              <Card key={item.id} withBorder padding="md" radius="md">
                <Stack gap="sm">
                  {/* Header */}
                  <Group justify="apart" wrap="nowrap">
                    <Group gap="xs" wrap="wrap">
                      <Badge color={getTypeColor(item.type)} size="lg">
                        {item.type.toUpperCase()}
                      </Badge>
                      <Badge color={statusConfig.color} variant="light" leftSection={statusConfig.icon}>
                        {statusConfig.label}
                      </Badge>
                      {item.type === 'review' && item.rating && (
                        <span className="text-sm">⭐ {item.rating}/5</span>
                      )}
                    </Group>
                    <span className="text-xs text-gray-500">
                      {formatDate(item.created_at)}
                    </span>
                  </Group>

                  {/* Customer Info */}
                  {item.customers && (
                    <div className="text-sm bg-gray-50 p-2 rounded">
                      <span className="font-semibold">Customer:</span> {item.customers.full_name} 
                      {' | '}
                      <span className="font-semibold">Account:</span> {item.customers.account_no}
                      {' | '}
                      <span className="font-semibold">Phone:</span> {item.customers.phone}
                    </div>
                  )}

                  {/* Feedback Content */}
                  <Title order={4} className="font-semibold">
                    {item.subject}
                  </Title>
                  <p className="text-gray-700">{item.message}</p>

                  {/* Admin Response if exists */}
                  {item.admin_response && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-md">
                      <Group gap="xs" mb="xs">
                        <MessageCircle size={16} className="text-blue-600" />
                        <span className="font-semibold text-blue-800">Admin Response:</span>
                      </Group>
                      <p className="text-gray-700 text-sm">{item.admin_response}</p>
                      {item.responded_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Responded: {formatDate(item.responded_at)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <Group justify="flex-end" mt="sm">
                    {item.status !== 'resolved' && item.status !== 'closed' && (
                      <>
                        <Select
                          placeholder="Update status"
                          data={[
                            { value: 'open', label: 'Open' },
                            { value: 'in_progress', label: 'In Progress' },
                            { value: 'resolved', label: 'Resolved' },
                            { value: 'closed', label: 'Closed' },
                          ]}
                          value={item.status}
                          onChange={(value) => value && handleStatusUpdate(item.id, value)}
                          disabled={updatingStatus}
                          style={{ width: 150 }}
                          size="xs"
                        />
                        <Button
                          size="xs"
                          leftSection={<MessageCircle size={14} />}
                          onClick={() => openResponseModal(item)}
                          color="blue"
                        >
                          Respond
                        </Button>
                      </>
                    )}
                    <Button
                      size="xs"
                      variant="subtle"
                      leftSection={<Eye size={14} />}
                      onClick={() => {
                        setSelectedFeedback(item);
                        openResponseModal(item);
                      }}
                    >
                      View Details
                    </Button>
                  </Group>
                </Stack>
              </Card>
            );
          })}

          {/* Pagination */}
          {filteredFeedback.length > itemsPerPage && (
            <Group justify="center" mt="lg">
              <Pagination
                total={Math.ceil(filteredFeedback.length / itemsPerPage)}
                value={currentPage}
                onChange={setCurrentPage}
                size="sm"
              />
            </Group>
          )}
        </Stack>
      )}

      {/* Response Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Respond to Feedback: ${selectedFeedback?.subject || ''}`}
        size="lg"
      >
        {selectedFeedback && (
          <form onSubmit={responseForm.onSubmit((values:any) => handleRespond(selectedFeedback.id, values))}>
            <Stack gap="md">
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-semibold mb-1">Customer Message:</p>
                <p className="text-sm text-gray-700">{selectedFeedback.message}</p>
                {selectedFeedback.type === 'review' && selectedFeedback.rating && (
                  <p className="text-sm mt-2">⭐ Rating: {selectedFeedback.rating}/5</p>
                )}
              </div>

              <Select
                label="Update Status"
                data={[
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'closed', label: 'Closed' },
                ]}
                {...responseForm.getInputProps('status')}
              />

              <Textarea
                label="Your Response"
                placeholder="Type your response here..."
                minRows={4}
                {...responseForm.getInputProps('admin_response')}
              />

              <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={responding} leftSection={<MessageCircle size={16} />}>
                  Send Response
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>
    </Container>
  );
};

export default AdminFeedback;