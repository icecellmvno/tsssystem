import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowUpDown, Hash, Globe, Signal, Calendar, User, Building2, Phone, Edit, Trash2, MessageSquare, Clock, DollarSign, AlertTriangle, CheckCircle, XCircle, ArrowUp, ArrowDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

// Common column types
export interface BaseRecord {
  id: number
  created_at: string
  updated_at: string
}

// Sortable header component
export function SortableHeader({ 
  children, 
  column, 
  icon 
}: { 
  children: React.ReactNode
  column: any
  icon?: React.ReactNode
}) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}

// Common column definitions
export function createIdColumn<T extends BaseRecord>(): ColumnDef<T> {
  return {
    accessorKey: 'id',
    header: ({ column }) => (
      <SortableHeader column={column}>
        ID
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <Badge variant="secondary">{row.getValue('id')}</Badge>
    ),
  }
}

export function createMccColumn<T extends { mcc: string }>(): ColumnDef<T> {
  return {
    accessorKey: 'mcc',
    header: ({ column }) => (
      <SortableHeader column={column} icon={<Hash className="h-4 w-4" />}>
        MCC
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="font-mono font-medium">{row.getValue('mcc')}</span>
    ),
  }
}

export function createMncColumn<T extends { mnc: string }>(): ColumnDef<T> {
  return {
    accessorKey: 'mnc',
    header: ({ column }) => (
      <SortableHeader column={column} icon={<Hash className="h-4 w-4" />}>
        MNC
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="font-mono">{row.getValue('mnc')}</span>
    ),
  }
}

export function createCountryColumn<T extends { country: string }>(): ColumnDef<T> {
  return {
    accessorKey: 'country',
    header: ({ column }) => (
      <SortableHeader column={column} icon={<Globe className="h-4 w-4" />}>
        Country
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <span>{row.getValue('country')}</span>
    ),
  }
}

export function createNetworkColumn<T extends { network: string }>(): ColumnDef<T> {
  return {
    accessorKey: 'network',
    header: ({ column }) => (
      <SortableHeader column={column} icon={<Signal className="h-4 w-4" />}>
        Network
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <span>{row.getValue('network')}</span>
    ),
  }
}

export function createIsoColumn<T extends { iso: string }>(): ColumnDef<T> {
  return {
    accessorKey: 'iso',
    header: 'ISO',
    cell: ({ row }) => {
      const iso = row.getValue('iso') as string
      return <Badge variant="outline">{iso.toUpperCase()}</Badge>
    },
  }
}

export function createNameColumn<T extends { name: string }>(): ColumnDef<T> {
  return {
    accessorKey: 'name',
    header: ({ column }) => (
      <SortableHeader column={column} icon={<Building2 className="h-4 w-4" />}>
        Name
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        {row.getValue('name')}
      </div>
    ),
  }
}

export function createPhoneCodeColumn<T extends { country_phone_code: string }>(): ColumnDef<T> {
  return {
    accessorKey: 'country_phone_code',
    header: 'Phone Code',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-muted-foreground" />
        <Badge variant="outline">{row.getValue('country_phone_code')}</Badge>
      </div>
    ),
  }
}

export function createManagerUserColumn<T extends { manager_user: number }>(): ColumnDef<T> {
  return {
    accessorKey: 'manager_user',
    header: 'Manager User',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        {row.getValue('manager_user')}
      </div>
    ),
  }
}

export function createOperatorUserColumn<T extends { operator_user: number }>(): ColumnDef<T> {
  return {
    accessorKey: 'operator_user',
    header: 'Operator User',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        {row.getValue('operator_user')}
      </div>
    ),
  }
}

export function createCreatedAtColumn<T extends { created_at: string }>(): ColumnDef<T> {
  return {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <SortableHeader column={column} icon={<Calendar className="h-4 w-4" />}>
        Created At
      </SortableHeader>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'))
      return (
        <span className="text-sm text-muted-foreground">
          {date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )
    },
  }
}

export function createReceivedAtColumn<T extends { received_at: string | null }>(): ColumnDef<T> {
  return {
    accessorKey: 'received_at',
    header: ({ column }) => (
      <SortableHeader column={column} icon={<Calendar className="h-4 w-4" />}>
        Received At
      </SortableHeader>
    ),
    cell: ({ row }) => {
      const date = row.getValue('received_at') as string | null
      if (!date) {
        return <span className="text-muted-foreground">-</span>
      }
      const dateObj = new Date(date)
      return (
        <span className="text-sm text-muted-foreground">
          {dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )
    },
  }
}

// SMS Logs specific column definitions
export function createMessageIdColumn<T extends { message_id: string }>(): ColumnDef<T> {
  return {
    accessorKey: 'message_id',
    header: ({ column }) => (
      <SortableHeader column={column} icon={<MessageSquare className="h-4 w-4" />}>
        Message ID
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.getValue('message_id')}</span>
    ),
  }
}

export function createSmsStatusColumn<T extends { status: string }>(): ColumnDef<T> {
  return {
    accessorKey: 'status',
    header: ({ column }) => (
      <SortableHeader column={column} icon={<CheckCircle className="h-4 w-4" />}>
        Status
      </SortableHeader>
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary"
      
      switch (status.toLowerCase()) {
        case 'delivered':
        case 'sent':
        case 'accepted':
          variant = 'default'
          break
        case 'failed':
        case 'rejected':
        case 'expired':
        case 'timeout':
        case 'undeliverable':
          variant = 'destructive'
          break
        case 'pending':
        case 'queued':
        case 'submitted':
          variant = 'outline'
          break
        default:
          variant = 'secondary'
      }
      
      return <Badge variant={variant}>{status}</Badge>
    },
  }
}

export function createDirectionColumn<T extends { direction: string }>(): ColumnDef<T> {
  return {
    accessorKey: 'direction',
    header: ({ column }) => (
      <SortableHeader column={column} icon={<ArrowUp className="h-4 w-4" />}>
        Direction
      </SortableHeader>
    ),
    cell: ({ row }) => {
      const direction = row.getValue('direction') as string
      const isInbound = direction.toLowerCase() === 'inbound'
      
      return (
        <div className="flex items-center gap-2">
          {isInbound ? (
            <ArrowDown className="h-4 w-4 text-blue-500" />
          ) : (
            <ArrowUp className="h-4 w-4 text-green-500" />
          )}
          <Badge variant={isInbound ? "outline" : "default"}>
            {direction}
          </Badge>
        </div>
      )
    },
  }
}

export function createPriorityColumn<T extends { priority: string }>(): ColumnDef<T> {
  return {
    accessorKey: 'priority',
    header: ({ column }) => (
      <SortableHeader column={column} icon={<AlertTriangle className="h-4 w-4" />}>
        Priority
      </SortableHeader>
    ),
    cell: ({ row }) => {
      const priority = row.getValue('priority') as string
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary"
      
      switch (priority.toLowerCase()) {
        case 'urgent':
          variant = 'destructive'
          break
        case 'high':
          variant = 'default'
          break
        case 'normal':
          variant = 'outline'
          break
        case 'low':
          variant = 'secondary'
          break
        default:
          variant = 'secondary'
      }
      
      return <Badge variant={variant}>{priority}</Badge>
    },
  }
}

export function createSourceAddrColumn<T extends { source_addr: string | null }>(): ColumnDef<T> {
  return {
    accessorKey: 'source_addr',
    header: 'Source Address',
    cell: ({ row }) => {
      const addr = row.getValue('source_addr') as string
      return addr ? (
        <span className="font-mono text-sm">{addr}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  }
}

export function createSourceConnectorColumn<T extends { source_connector: string | null }>(): ColumnDef<T> {
  return {
    accessorKey: 'source_connector',
    header: 'Source',
    cell: ({ row }) => {
      const connector = row.getValue('source_connector') as string
      
      const getSourceIcon = (connector: string) => {
        switch (connector) {
          case "manual":
            return <User className="h-4 w-4" />
          case "http_api":
            return <MessageSquare className="h-4 w-4" />
          case "smpp":
            return <Phone className="h-4 w-4" />
          default:
            return <MessageSquare className="h-4 w-4" />
        }
      }

      const getSourceBadgeVariant = (connector: string) => {
        switch (connector) {
          case "manual":
            return "default"
          case "http_api":
            return "secondary"
          case "smpp":
            return "outline"
          default:
            return "secondary"
        }
      }

      if (!connector) {
        return <span className="text-muted-foreground">-</span>
      }

      return (
        <div className="flex items-center gap-2">
          {getSourceIcon(connector)}
          <Badge variant={getSourceBadgeVariant(connector)} className="w-fit">
            {connector}
          </Badge>
        </div>
      )
    },
  }
}

export function createSourceUserColumn<T extends { source_user: string | null }>(): ColumnDef<T> {
  return {
    accessorKey: 'source_user',
    header: 'User',
    cell: ({ row }) => {
      const user = row.getValue('source_user') as string

      if (!user) {
        return <span className="text-muted-foreground">-</span>
      }

      return (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="font-medium">{user}</span>
        </div>
      )
    },
  }
}

export function createDestinationAddrColumn<T extends { destination_addr: string | null }>(): ColumnDef<T> {
  return {
    accessorKey: 'destination_addr',
    header: 'Destination Address',
    cell: ({ row }) => {
      const addr = row.getValue('destination_addr') as string
      return addr ? (
        <span className="font-mono text-sm">{addr}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  }
}

export function createMessageColumn<T extends { message?: string | null; message_length?: number }>(): ColumnDef<T> {
  return {
    accessorKey: 'message',
    header: 'Message',
    cell: ({ row }) => {
      const message = row.getValue('message') as string || null
      const messageLength = row.getValue('message_length') as number || (message ? message.length : 0)
      
      if (!message) {
        return <span className="text-muted-foreground">-</span>
      }
      
      // Use SMS count library for accurate calculation
      let smsCount = 1
      let limit = 160
      let charsLeft = 0
      
      try {
        if (typeof window !== 'undefined' && (window as any).SMS) {
          const sms = new (window as any).SMS()
          const result = sms.count(message)
          smsCount = result.totalSms
          limit = result.limit
          charsLeft = result.charsLeft
        } else {
          // Fallback to simple calculation
          smsCount = Math.ceil(messageLength / 160)
        }
      } catch (error) {
        console.warn('SMS count library error:', error)
        // Fallback to simple calculation if SMS library fails
        smsCount = Math.ceil(messageLength / 160)
      }
      
      const truncated = message.length > 50 ? `${message.substring(0, 50)}...` : message
      
      return (
        <div className="max-w-xs">
          <div className="text-sm">{truncated}</div>
          <div className="text-xs text-muted-foreground">
            {messageLength} chars • {smsCount} SMS
            {charsLeft > 0 && charsLeft < limit && (
              <span className="ml-1">({charsLeft} left)</span>
            )}
          </div>
        </div>
      )
    },
  }
}

export function createDeviceNameColumn<T extends { device_name?: string | null; device_group?: string | null; country_site?: string | null }>(): ColumnDef<T> {
  return {
    accessorKey: 'device_name',
    header: 'Device',
    cell: ({ row }) => {
      const name = row.getValue('device_name') as string || null
      const group = row.getValue('device_group') as string || null
      const site = row.getValue('country_site') as string || null
      
      return (
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{name || '-'}</span>
          </div>
          {(group || site) && (
            <div className="text-xs text-muted-foreground space-y-1">
              {group && <div>Group: {group}</div>}
              {site && <div>Site: {site}</div>}
            </div>
          )}
        </div>
      )
    },
  }
}

export function createSimCardColumn<T extends { simcard_name?: string | null; sim_slot?: number | null; device_imsi?: string | null }>(): ColumnDef<T> {
  return {
    accessorKey: 'simcard_name',
    header: 'SIM Card',
    cell: ({ row }) => {
      const name = row.getValue('simcard_name') as string || null
      const slot = row.getValue('sim_slot') as number || null
      const imsi = row.getValue('device_imsi') as string || null
      
      return (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            {name && <div className="text-sm font-medium truncate">{name}</div>}
            {slot && <div className="text-xs text-muted-foreground">Slot {slot}</div>}
            {imsi && <div className="text-xs text-muted-foreground font-mono">IMSI: {imsi}</div>}
            {!name && slot && (
              <div className="text-xs text-muted-foreground">SIM Card (Slot {slot})</div>
            )}
            {!name && !slot && !imsi && (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        </div>
      )
    },
  }
}

export function createCostColumn<T extends { total_cost: string; currency: string }>(): ColumnDef<T> {
  return {
    accessorKey: 'total_cost',
    header: ({ column }) => (
      <SortableHeader column={column} icon={<DollarSign className="h-4 w-4" />}>
        Cost
      </SortableHeader>
    ),
    cell: ({ row }) => {
      const cost = row.getValue('total_cost') as string
      const currency = row.getValue('currency') as string
      
      return (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono">{cost} {currency}</span>
        </div>
      )
    },
  }
}

export function createSmppSentColumn<T extends { smpp_sent: boolean }>(): ColumnDef<T> {
  return {
    accessorKey: 'smpp_sent',
    header: 'SMPP Sent',
    cell: ({ row }) => {
      const sent = row.getValue('smpp_sent') as boolean
      
      return (
        <div className="flex items-center gap-2">
          {sent ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <Badge variant={sent ? "default" : "destructive"}>
            {sent ? 'Sent' : 'Not Sent'}
          </Badge>
        </div>
      )
    },
  }
}

// Actions column factory
export function createActionsColumn<T extends BaseRecord>({
  onEdit,
  onDelete,
  editPath,
  deleteConfirmMessage = "Are you sure you want to delete this record? This action cannot be undone.",
}: {
  onEdit?: (record: T) => void
  onDelete?: (record: T) => void
  editPath?: (record: T) => string
  deleteConfirmMessage?: string
}): ColumnDef<T> {
  return {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const record = row.original
      return (
        <div className="flex items-center justify-end gap-2">
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={() => onEdit(record)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {editPath && (
            <Link to={editPath(record)}>
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          )}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Record</AlertDialogTitle>
                  <AlertDialogDescription>
                    {deleteConfirmMessage}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(record)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )
    },
  }
}

// Status badge column factory
export function createStatusColumn<T extends { status?: string; is_active?: boolean }>(
  statusKey: keyof T = 'status' as keyof T
): ColumnDef<T> {
  return {
    accessorKey: statusKey as string,
    header: 'Status',
    cell: ({ row }) => {
      const value = row.getValue(statusKey as string)
      let status: string
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary"

      if (statusKey === 'is_active') {
        status = value ? 'Active' : 'Inactive'
        variant = value ? 'default' : 'destructive'
      } else if (typeof value === 'string') {
        status = value
        const statusLower = value.toLowerCase()
        if (statusLower === 'active' || statusLower === 'enabled' || statusLower === 'success') {
          variant = 'default'
        } else if (statusLower === 'inactive' || statusLower === 'disabled' || statusLower === 'error') {
          variant = 'destructive'
        } else if (statusLower === 'pending' || statusLower === 'warning') {
          variant = 'outline'
        }
      } else {
        status = String(value)
      }

      return <Badge variant={variant}>{status}</Badge>
    },
  }
} 

export function createSourceDestinationColumn<T extends { source_addr?: string | null; destination_addr?: string | null; source_connector?: string | null; source_user?: string | null }>(): ColumnDef<T> {
  return {
    accessorKey: 'source_addr',
    header: 'Source ↔ Destination',
    cell: ({ row }) => {
      const sourceAddr = row.getValue('source_addr') as string || null
      const destAddr = row.getValue('destination_addr') as string || null
      const connector = row.getValue('source_connector') as string || null
      const user = row.getValue('source_user') as string || null
      
      return (
        <div className="space-y-1">
          {/* Source Information */}
          <div className="flex items-center gap-2">
            <ArrowUp className="h-3 w-3 text-blue-500" />
            <div className="min-w-0 flex-1">
              {sourceAddr ? (
                <div className="text-sm font-mono">{sourceAddr}</div>
              ) : (
                <div className="text-sm text-muted-foreground">Panel</div>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {connector && <Badge variant="outline" className="text-xs">{connector}</Badge>}
                {user && <span>via {user}</span>}
              </div>
            </div>
          </div>
          
          {/* Destination Information */}
          <div className="flex items-center gap-2">
            <ArrowDown className="h-3 w-3 text-green-500" />
            <div className="text-sm font-mono">
              {destAddr || <span className="text-muted-foreground">-</span>}
            </div>
          </div>
        </div>
      )
    },
  }
} 