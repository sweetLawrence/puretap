import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Tabs,
  TextInput,
  Textarea,
  Select,
  Rating,
  Button,
  Card,
  Badge,
  Group,
  Stack,
  Loader,
  Pagination,
  SegmentedControl,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Send, List, MessageCircle } from 'lucide-react';
import api from '../utils/api';

interface FeedbackItem {
  id: string;
  type: 'complaint' | 'suggestion' | 'review';
  subject: string;
  message: string;
  rating?: number;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  admin_response?: string;
  created_at: string;
  responded_at?: string;
}

const Feedback = () => {
  const [activeTab, setActiveTab] = useState<string | null>('submit');
  const [loading, setLoading] = useState(false);
  const [myFeedback, setMyFeedback] = useState<FeedbackItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  const itemsPerPage = 5;

  // Form for submitting feedback
  const form = useForm({
    initialValues: {
      type: 'complaint',
      subject: '',
      message: '',
      rating: 0,
    },
    validate: {
      subject: (value) => (value.length < 3 ? 'Subject must be at least 3 characters' : null),
      message: (value) => (value.length < 10 ? 'Message must be at least 10 characters' : null),
      rating: (value, values) => {
        if (values.type === 'review' && value === 0) {
          return 'Rating is required for reviews';
        }
        return null;
      },
    },
  });

  // Fetch my feedback
  const fetchMyFeedback = async () => {
    setLoading(true);
    try {
      const response = await api.get('/feedback/my');
      if (response.data.success) {
        setMyFeedback(response.data.data);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  // Submit feedback
  const handleSubmit = async (values: typeof form.values) => {
    setSubmitting(true);
    try {
      const response = await api.post('/feedback', values);
      if (response.data.success) {
        alert('Feedback submitted successfully!');
        form.reset();
        form.setValues({ type: 'complaint', subject: '', message: '', rating: 0 });
      }
    } catch (error: any) {
      alert(' Error: ' + (error.response?.data?.message || 'Failed to submit feedback'));
    } finally {
      setSubmitting(false);
    }
  };

  // Load feedback when tab changes to 'my'
  useEffect(() => {
    if (activeTab === 'my') {
      fetchMyFeedback();
    }
  }, [activeTab]);

  // Filter feedback
  const filteredFeedback = myFeedback.filter(fb => 
    filterStatus === 'all' ? true : fb.status === filterStatus
  );

  // Pagination
  const paginatedFeedback = filteredFeedback.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'yellow';
      case 'in_progress': return 'blue';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      default: return 'gray';
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

  return (
    <Container size="lg" py="xl">
      <Title order={1} className="mb-2">
        Feedback Center
      </Title>
      <p className="text-gray-600 mb-8">
        Share your thoughts, report issues, or suggest improvements
      </p>

      <Card withBorder radius="md" p="lg">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List grow mb="lg">
            <Tabs.Tab value="submit" leftSection={<Send size={16} />}>
              Submit Feedback
            </Tabs.Tab>
            <Tabs.Tab value="my" leftSection={<List size={16} />}>
              My Feedback
            </Tabs.Tab>
          </Tabs.List>

          {/* Submit Feedback Tab */}
          <Tabs.Panel value="submit">
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <Select
                  label="Feedback Type"
                  placeholder="Select type"
                  data={[
                    { value: 'complaint', label: ' Complaint - Report an issue' },
                    { value: 'suggestion', label: ' Suggestion - Share an idea' },
                    { value: 'review', label: ' Review - Rate our service' },
                  ]}
                  {...form.getInputProps('type')}
                />

                <TextInput
                  label="Subject"
                  placeholder="Brief summary of your feedback"
                  {...form.getInputProps('subject')}
                />

                <Textarea
                  label="Message"
                  placeholder="Provide detailed information..."
                  minRows={4}
                  {...form.getInputProps('message')}
                />

                {form.values.type === 'review' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Rating
                    </label>
                    <Rating
                      value={form.values.rating}
                      onChange={(value) => form.setFieldValue('rating', value)}
                      size="lg"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  loading={submitting}
                  leftSection={<Send size={16} />}
                  fullWidth
                  mt="md"
                >
                  Submit Feedback
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>

          {/* My Feedback Tab */}
          <Tabs.Panel value="my">
            <Stack gap="lg">
              {/* Filters */}
              <Group justify="space-between">
                <SegmentedControl
                  value={filterStatus}
                  onChange={setFilterStatus}
                  data={[
                    { label: 'All', value: 'all' },
                    { label: 'Open', value: 'open' },
                    { label: 'In Progress', value: 'in_progress' },
                    { label: 'Resolved', value: 'resolved' },
                    { label: 'Closed', value: 'closed' },
                  ]}
                  size="sm"
                />
                <Badge size="lg" variant="light" color="blue">
                  Total: {filteredFeedback.length}
                </Badge>
              </Group>

              {/* Feedback List */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader size="xl" />
                </div>
              ) : paginatedFeedback.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {filterStatus === 'all' 
                    ? "You haven't submitted any feedback yet." 
                    : `No ${filterStatus} feedback found.`}
                </div>
              ) : (
                <Stack gap="md">
                  {paginatedFeedback.map((feedback) => (
                    <Card key={feedback.id} withBorder padding="md" radius="md">
                      <Stack gap="xs">
                        <Group justify="apart">
                          <Group gap="xs">
                            <Badge color={getTypeColor(feedback.type)}>
                              {feedback.type.toUpperCase()}
                            </Badge>
                            <Badge color={getStatusColor(feedback.status)} variant="light">
                              {feedback.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {feedback.type === 'review' && feedback.rating && (
                              <Rating value={feedback.rating} readOnly size="sm" />
                            )}
                          </Group>
                          <span className="text-xs text-gray-500">
                            {formatDate(feedback.created_at)}
                          </span>
                        </Group>

                        <Title order={4} className="font-semibold mt-2">
                          {feedback.subject}
                        </Title>

                        <p className="text-gray-700 text-sm">{feedback.message}</p>

                        {feedback.admin_response && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-md">
                            <Group gap="xs" mb="xs">
                              <MessageCircle size={16} className="text-blue-600" />
                              <span className="font-semibold text-blue-800 text-sm">
                                Admin Response:
                              </span>
                            </Group>
                            <p className="text-gray-700 text-sm">
                              {feedback.admin_response}
                            </p>
                            {feedback.responded_at && (
                              <p className="text-xs text-gray-500 mt-1">
                                Responded: {formatDate(feedback.responded_at)}
                              </p>
                            )}
                          </div>
                        )}
                      </Stack>
                    </Card>
                  ))}

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
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Card>
    </Container>
  );
};

export default Feedback;