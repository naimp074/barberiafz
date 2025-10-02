import React, { useState, useEffect } from 'react';
import { Scissors, Calendar as CalendarIcon, DollarSign, TrendingUp, Users, LogOut, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar } from './Calendar';

interface Service {
  id: string;
  name: string;
  price: number;
  timestamp: Date;
}

interface ServiceType {
  name: string;
  price: number;
  icon: string;
}

const serviceTypes: ServiceType[] = [
  { name: 'Corte', price: 6500, icon: '✂️' },
  { name: 'Corte y perfilado', price: 7000, icon: '✂️✨' },
  { name: 'Corte y barba', price: 7500, icon: '✂️🧔' },
  { name: 'Corte barba y perfilado', price: 8000, icon: '✂️🧔✨' },
  { name: 'Barba', price: 3000, icon: '🧔' },
];

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      setServices(
        data.map((service) => ({
          ...service,
          timestamp: new Date(service.timestamp),
        }))
      );
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const addService = async (serviceType: ServiceType) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('services')
        .insert([
          {
            user_id: user.id,
            name: serviceType.name,
            price: serviceType.price,
            timestamp: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setServices((prev) => [
        {
          ...data,
          timestamp: new Date(data.timestamp),
        },
        ...prev,
      ]);
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!user) return;

    // Confirmar eliminación
    if (!window.confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)
        .eq('user_id', user.id); // Solo permitir eliminar servicios del usuario actual

      if (error) throw error;

      setServices((prev) => prev.filter((service) => service.id !== serviceId));
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error al eliminar el servicio. Inténtalo de nuevo.');
    }
  };

  const getTodaysServices = () => {
    const today = new Date();
    return services.filter((service) => {
      const serviceDate = new Date(service.timestamp);
      return serviceDate.toDateString() === today.toDateString();
    });
  };

  const getServicesForDate = (date: Date) => {
    return services.filter((service) => {
      const serviceDate = new Date(service.timestamp);
      return serviceDate.toDateString() === date.toDateString();
    });
  };

  const getWeeklyServices = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return services.filter((service) => {
      const serviceDate = new Date(service.timestamp);
      return serviceDate >= weekStart;
    });
  };

  const getMonthlyServices = () => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    return services.filter((service) => {
      const serviceDate = new Date(service.timestamp);
      return serviceDate >= monthStart;
    });
  };

  const getYearlyServices = () => {
    const today = new Date();
    const yearStart = new Date(today.getFullYear(), 0, 1);

    return services.filter((service) => {
      const serviceDate = new Date(service.timestamp);
      return serviceDate >= yearStart;
    });
  };

  const calculateEarnings = (serviceList: Service[]) => {
    return serviceList.reduce((total, service) => total + service.price, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const todaysServices = getTodaysServices();
  const weeklyServices = getWeeklyServices();
  const monthlyServices = getMonthlyServices();
  const yearlyServices = getYearlyServices();
  const selectedDateServices = getServicesForDate(selectedDate);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scissors className="w-8 h-8 text-gray-400" />
            <h1 className="text-4xl font-bold text-white">fzbarber</h1>
            <Scissors className="w-8 h-8 text-gray-400 scale-x-[-1]" />
          </div>
          <p className="text-gray-300 text-lg">Sistema de Control de Ganancias</p>
          <div className="flex items-center justify-center gap-2 mt-2 text-gray-400">
            <CalendarIcon className="w-4 h-4" />
            <span>
              {currentDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <button
            onClick={signOut}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-gray-700 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-white" />
              <h3 className="text-white font-semibold">Hoy</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(calculateEarnings(todaysServices))}
            </p>
            <p className="text-gray-400 text-sm">{todaysServices.length} servicios</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-white" />
              <h3 className="text-white font-semibold">Esta Semana</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(calculateEarnings(weeklyServices))}
            </p>
            <p className="text-gray-400 text-sm">{weeklyServices.length} servicios</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <CalendarIcon className="w-6 h-6 text-white" />
              <h3 className="text-white font-semibold">Este Mes</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(calculateEarnings(monthlyServices))}
            </p>
            <p className="text-gray-400 text-sm">{monthlyServices.length} servicios</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-white" />
              <h3 className="text-white font-semibold">Este Año</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(calculateEarnings(yearlyServices))}
            </p>
            <p className="text-gray-400 text-sm">{yearlyServices.length} servicios</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Calendar
            services={services}
            onDateSelect={setSelectedDate}
            selectedDate={selectedDate}
          />

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
            <div className="mb-6">
              <div className="bg-white/5 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-sm mb-1">Total del día</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(calculateEarnings(selectedDateServices))}</p>
                <p className="text-gray-400 text-sm mt-1">{selectedDateServices.length} servicios</p>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {selectedDateServices.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No hay servicios registrados</p>
              ) : (
                <div className="space-y-3">
                  {selectedDateServices.map((service) => (
                    <div
                      key={service.id}
                      className="bg-white/5 rounded-lg p-4 flex justify-between items-center border border-gray-800"
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">{service.name}</p>
                        <p className="text-gray-400 text-sm">
                          {service.timestamp.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-white font-bold">{formatCurrency(service.price)}</div>
                        <button
                          onClick={() => deleteService(service.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Eliminar servicio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Registrar Servicio</h2>
            <div className="grid grid-cols-1 gap-4">
              {serviceTypes.map((service, index) => (
                <button
                  key={index}
                  onClick={() => addService(service)}
                  className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white p-4 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl border border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{service.icon}</div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-sm">{service.name}</div>
                      <div className="text-lg font-bold">{formatCurrency(service.price)}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Servicios de Hoy</h2>
            <div className="max-h-96 overflow-y-auto">
              {todaysServices.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No hay servicios registrados hoy</p>
              ) : (
                <div className="space-y-3">
                  {todaysServices.map((service) => (
                    <div
                      key={service.id}
                      className="bg-white/5 rounded-lg p-4 flex justify-between items-center border border-gray-800"
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">{service.name}</p>
                        <p className="text-gray-400 text-sm">
                          {service.timestamp.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-white font-bold">{formatCurrency(service.price)}</div>
                        <button
                          onClick={() => deleteService(service.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Eliminar servicio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-gray-500">
          <p className="text-sm">© 2024 Peluquería El Estilo - Sistema de Control de Ganancias</p>
        </div>
      </div>
    </div>
  );
}
