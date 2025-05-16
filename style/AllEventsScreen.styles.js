import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: '#4F8EF7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  eventList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  dateHeader: {
    paddingVertical: 12,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  todayIndicator: {
    color: '#4F8EF7',
    fontWeight: 'bold',
  },
  eventItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4F8EF7',
    paddingLeft: 16,
    marginLeft: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pastEvent: {
    borderLeftColor: '#4CAF50',
    opacity: 0.8,
  },
  todayEvent: {
    borderLeftColor: '#FF9800',
    backgroundColor: '#FFF9E6',
  },
  timeContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    marginBottom: 4,
  },
  statusIcon: {
    marginTop: 4,
  },
  eventContent: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
});
