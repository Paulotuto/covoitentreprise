
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://onbdjfmjgqjgrgwghunb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uYmRqZm1qZ3FqZ3Jnd2dodW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NzMwNDgsImV4cCI6MjA4MzM0OTA0OH0.iBTK19d04PIIpp2JCiOIrhnW0gxAjfsqwU61uTH8wW0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkColumns() {
    try {
        const { data, error } = await supabase.from('event_vehicles').select('*').limit(1)
        if (error) {
            console.error('Error fetching data:', error)
            return
        }
        if (data && data.length > 0) {
            console.log('Columns:', Object.keys(data[0]).join(', '))
        } else {
            console.log('No data found in event_vehicles to check columns.')
        }
    } catch (err) {
        console.error('Catch error:', err)
    }
}

checkColumns()
