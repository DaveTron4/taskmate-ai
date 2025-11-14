import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';

import { timelineItemClasses } from '@mui/lab/TimelineItem';

import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';

export default function Calendar() {
    return (
        <div className='bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 flex flex-col h-full'>
            {/* calendar */}
            <div className='flex-1 flex items-center justify-center'>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateCalendar
                        views={['day']}
                        sx={{
                            width: '100%',
                            height: '100%',
                            'margin': 0,
                            '& .MuiPickersCalendarHeader-root': {
                                width: '100%',
                            },
                            '& .MuiDayCalendar-root': {
                                width: '100%',
                            },
                        }}
                    />
                </LocalizationProvider>
            </div>

            {/* events */}
            <div className='mt-6'>
                <h3 className='text-lg sm:text-xl font-bold text-[black] mb-4 sm:mb-6'>Events</h3>
                <div className='bg-gray-50 rounded-2xl p-4'>
                    <Timeline
                        sx={{
                            [`& .${timelineItemClasses.root}:before`]: {
                                flex: 0,
                                padding: 0,
                            },
                        }}
                    >
                        <TimelineItem>
                            <TimelineSeparator>
                                <TimelineDot />
                                <TimelineConnector />
                            </TimelineSeparator>
                            <TimelineContent>
                                <div className="break-words">
                                    <div className="text-sm lg:text-md font-semibold break-words">Event Title</div>
                                    <div className="text-sm lg:text-md text-gray-600">Event Time</div>
                                    <div className="text-sm lg:text-md text-gray-500 break-words">Event Location</div>
                                </div>
                            </TimelineContent>
                        </TimelineItem>
                    </Timeline>
                </div>
            </div>
        </div>
    );
}