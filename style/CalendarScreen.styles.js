import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: '#4F8EF7',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  navIconContainer: {
    position: 'absolute',
    left: 16,
    top: 54,
  },
  headerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  calendar: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  dayContainer: {
    width: 40,
    height: 54,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 3,
    borderRadius: 8,
    marginVertical: 1,
  },
  selectedDay: {
    backgroundColor: '#E3EDFC',
  },
  dayText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#4F8EF7',
    fontWeight: 'bold',
  },
  todayText: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F8EF7',
  },
  dayDisabled: {
    color: '#ccc',
  },
  eventPreviewWrap: {
    marginTop: 2,
    alignItems: 'center',
  },
  eventPreviewText: {
    fontSize: 10,
    color: '#4F8EF7',
    maxWidth: 34,
  },
  eventPreviewMore: {
    fontSize: 9,
    color: '#aaa',
    marginTop: -2,
  },
  eventSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 18,
    padding: 16,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#4F8EF7',
  },
  noEvent: {
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  eventTime: {
    color: '#4F8EF7',
    fontWeight: 'bold',
    width: 60,
  },
  eventText: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 36,
    backgroundColor: '#4F8EF7',
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default styles;
