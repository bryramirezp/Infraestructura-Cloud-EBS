import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Award, Clock, CheckCircle, Star } from 'lucide-react';
import { Header } from '../components/Layout/Header';

export const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Clock,
      title: 'Acceso Flexible',
      description: 'Estudia desde cualquier lugar y a tu propio ritmo con acceso remoto a todos los materiales de enseñanza.'
    },
    {
      icon: CheckCircle,
      title: 'Evaluación Estandarizada',
      description: 'Valida tu aprendizaje a través de un sistema de evaluación claro y estandarizado que garantiza la calidad académica.'
    },
    {
      icon: Users,
      title: 'Mayor Motivación',
      description: 'Utiliza herramientas de seguimiento, foros y notificaciones diseñadas para mejorar tu participación y motivación.'
    },
    {
      icon: Award,
      title: 'Seguridad y Confianza',
      description: 'Tus datos y progreso están seguros gracias a una infraestructura confiable y escalable en la nube.'
    }
  ];

  const testimonials = [
    {
      name: 'María González',
      role: 'Estudiante',
      content: 'La plataforma ha transformado mi manera de estudiar la Biblia. Es intuitiva y muy completa.',
      rating: 5
    },
    {
      name: 'Pastor Carlos Ruiz',
      role: 'Profesor',
      content: 'Excelente herramienta para gestionar mis clases bíblicas y hacer seguimiento a los estudiantes.',
      rating: 5
    },
    {
      name: 'Ana Martínez',
      role: 'Estudiante',
      content: 'La formación espiritual nunca fue tan accesible. Contenido de calidad y fácil de seguir.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground theme-transition-all">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white pt-20 theme-transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              El Futuro de la
              <span className="text-primary-200"> Formación Bíblica Online</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Una plataforma digital diseñada para facilitar la enseñanza bíblica en modalidad online
              y fortalecer tu proceso de formación espiritual a través de una experiencia accesible,
              interactiva y medible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-all duration-300 flex items-center justify-center group hover-lift"
              >
                Contáctanos
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card theme-transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-card-foreground mb-4">
              Beneficios de Estudiar en Nuestra Plataforma
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Herramientas diseñadas para ofrecerte una experiencia de aprendizaje espiritual única y efectiva.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 rounded-xl bg-muted hover:bg-accent transition-all duration-300 group hover-lift"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-full mb-4 group-hover:bg-primary/90 transition-colors">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary-600 text-white theme-transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
              <div className="text-primary-200 text-lg">Estudiantes Activos</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">25+</div>
              <div className="text-primary-200 text-lg">Profesores</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">15+</div>
              <div className="text-primary-200 text-lg">Cursos Disponibles</div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-20 bg-muted theme-transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-card-foreground mb-4">
              Una Plataforma Diseñada para Ti
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Para el Estudiante */}
            <div className="theme-card p-8 rounded-xl hover-lift">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-2">Para el Estudiante Comprometido</h3>
              </div>
              <p className="text-muted-foreground text-center italic">
                "Una experiencia de aprendizaje flexible que te permite estudiar a tu ritmo,
                con herramientas para monitorear tu progreso y mantenerte motivado".
              </p>
            </div>

            {/* Para Nuestra Misión */}
            <div className="theme-card p-8 rounded-xl hover-lift">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
                  <Award className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-2">Para Nuestra Misión</h3>
              </div>
              <p className="text-muted-foreground text-center italic">
                "Buscamos fortalecer el proceso de formación espiritual de la comunidad,
                expandiendo el alcance de la enseñanza bíblica a través de una plataforma moderna y accesible".
              </p>
            </div>

            {/* Para una Educación de Calidad */}
            <div className="theme-card p-8 rounded-xl hover-lift">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/10 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-2">Para una Educación de Calidad</h3>
              </div>
              <p className="text-muted-foreground text-center italic">
                "Garantizamos una educación de excelencia con un sistema de evaluación estandarizado
                y la emisión de certificados que acrediten formalmente tus conocimientos".
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted theme-transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-card-foreground mb-4">
              Lo que Dicen Nuestros Usuarios
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="theme-card p-6 rounded-xl hover-lift">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-card-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white theme-transition-all">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ¿Listo para Fortalecer tu Formación Espiritual?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Únete a la comunidad de la Escuela Bíblica Salem en esta nueva etapa de aprendizaje digital.
          </p>
          <Link
            to="/contact"
            className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-all duration-300 inline-flex items-center group hover-lift"
          >
            Contáctanos
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
};
