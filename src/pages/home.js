import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Button, Container, Row, Col, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { API_URL, imageUrl } from '../config';
import './home.css';

const getErrorMessage = (err, fallback) =>
  err.response?.data?.message || err.message || fallback;

const Home = ({ handleLogout }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCoursePrice, setNewCoursePrice] = useState('');
  const [courseImage, setCourseImage] = useState(null);
  const [newCourseImage, setNewCourseImage] = useState(null);

  const authHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/courses`);
        if (response.data.status === 'success') {
          setCourses(response.data.data.courses);
        } else {
          setError('Failed to fetch courses.');
        }
      } catch (err) {
        console.error('Fetch courses failed:', err.response?.data || err);
        setError(getErrorMessage(err, 'Something went wrong. Please try again later.'));
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleEditClick = (course) => {
    setSelectedCourse(course);
    setNewTitle(course.title);
    setNewPrice(course.price);
    setNewCourseImage(null);
    setShowEditModal(true);
  };

  const handleSaveChanges = async () => {
    if (!localStorage.getItem('authToken')) {
      setError('You must be logged in to edit a course.');
      return;
    }

    const formData = new FormData();
    formData.append('title', newTitle);
    formData.append('price', newPrice);
    if (newCourseImage) {
      formData.append('courseImage', newCourseImage);
    }

    try {
      // No manual Content-Type: the browser adds multipart/form-data with the boundary
      const response = await axios.patch(
        `${API_URL}/api/courses/${selectedCourse._id}`,
        formData,
        { headers: { ...authHeaders() } }
      );

      if (response.data.status === 'success') {
        setCourses((prev) =>
          prev.map((course) =>
            course._id === selectedCourse._id
              ? { ...course, ...response.data.data.course }
              : course
          )
        );
        setShowEditModal(false);
        setNewCourseImage(null);
        setError('');
      } else {
        setError('Failed to update the course.');
      }
    } catch (err) {
      console.error('Update course failed:', err.response?.data || err);
      setError(getErrorMessage(err, 'Something went wrong. Please try again.'));
    }
  };

const handleDeleteClick = async (courseId) => {
  if (!window.confirm('Are you sure you want to delete this course?')) return;

  if (!localStorage.getItem('authToken')) {
    setError('You must be logged in to delete a course.');
    return;
  }

  try {
    const response = await axios.delete(`${API_URL}/api/courses/${courseId}`, {
      headers: authHeaders(),
    });

    if (response.data.status === 'success') {
      setCourses((prev) => prev.filter((course) => course._id !== courseId));
      setError('');
    }
  } catch (err) {
    console.error('Delete course failed:', err.response?.data || err);
    setError(getErrorMessage(err, 'Something went wrong. Please try again.'));
  }
};

  const handleAddCourse = async () => {
    if (!newCourseTitle || !newCoursePrice || !courseImage) {
      setError('Please fill out all fields, including uploading an image.');
      return;
    }
    if (!localStorage.getItem('authToken')) {
      setError('You must be logged in to add a course.');
      return;
    }

    const formData = new FormData();
    formData.append('title', newCourseTitle);
    formData.append('price', newCoursePrice);
    formData.append('courseImage', courseImage);

    try {
      // No manual Content-Type: the browser adds multipart/form-data with the boundary
      const response = await axios.post(`${API_URL}/api/courses`, formData, {
        headers: { ...authHeaders() },
      });

      if (response.data.status === 'success') {
        setCourses((prev) => [...prev, response.data.data.course]);
        setShowAddModal(false);
        setNewCourseTitle('');
        setNewCoursePrice('');
        setCourseImage(null);
        setError('');
      } else {
        setError('Failed to add the course.');
      }
    } catch (err) {
      console.error('Add course failed:', err.response?.data || err);
      setError(getErrorMessage(err, 'Something went wrong. Please try again.'));
    }
  };

  return (
    <div className="home-page">
      {/* Top bar */}
      <div className="home-navbar">
        <Container className="d-flex justify-content-between align-items-center">
          <h4 className="home-brand">🎓 CourseApp</h4>
          <div className="d-flex gap-2">
            <Button variant="light" className="btn-pill" onClick={() => setShowAddModal(true)}>
              + Add Course
            </Button>
            <Button variant="outline-light" className="btn-pill" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Container>
      </div>

      <Container className="pb-5">
        <div className="home-hero">
          <h1>Available Courses</h1>
          <p>Browse, edit and manage your course catalog.</p>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')} className="mt-3">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="state-box mt-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 mb-0">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="state-box mt-4">
            <h5>No courses yet</h5>
            <p className="mb-0">Click “Add Course” to create the first one.</p>
          </div>
        ) : (
          <Row className="mt-4">
            {courses.map((course) => (
              <Col key={course._id} sm={12} md={6} lg={4} className="mb-4">
                <Card className="course-card">
                  <div className="course-img-wrap">
                    <Card.Img variant="top" src={imageUrl(course.courseImage)} alt={course.title} />
                    <span className="price-badge">${course.price}</span>
                  </div>
                  <Card.Body>
                    <Card.Title className="course-title">{course.title}</Card.Title>
                    <div className="course-actions">
                      <Button variant="primary" onClick={() => handleEditClick(course)}>
                        Edit
                      </Button>
                      <Button variant="outline-danger" onClick={() => handleDeleteClick(course._id)}>
                        Delete
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* Edit Course Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Course Title</Form.Label>
              <Form.Control type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Course Price</Form.Label>
              <Form.Control type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Course Image</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={(e) => setNewCourseImage(e.target.files[0])} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Course Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Course Title</Form.Label>
              <Form.Control type="text" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} />
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Course Price</Form.Label>
              <Form.Control type="number" value={newCoursePrice} onChange={(e) => setNewCoursePrice(e.target.value)} />
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Course Image</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={(e) => setCourseImage(e.target.files[0])} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddCourse}>
            Add Course
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Home;